// Vercel serverless function — proxies agent calls to the Anthropic API with tiered model routing.
// The API key lives in the ANTHROPIC_API_KEY environment variable (never in client code).
// Tiers keep costs healthy: light = QA/classification, standard = specialist briefs, deep = synthesis/strategy.
// Pass { stream: true } in the body to receive Server-Sent Events — tokens forwarded as they arrive.
//
// QUOTAS (per calendar day, UTC):
//   Signed-in users — DAILY_CALL_LIMIT_USER API calls/day (default 300 ≈ 100 agent runs,
//     since each run makes up to 3 calls: draft + QA + optional revision). Counted in the
//     Supabase `events` table as type 'api_call', verified via the user's access token.
//   Anonymous/demo — DAILY_CALL_LIMIT_ANON calls/day per IP (default 50 ≈ 15 runs),
//     tracked in instance memory (best-effort deterrent; resets on cold starts).

export const config = { supportsResponseStreaming: true };

const MODELS = {
  light: "claude-haiku-4-5-20251001",
  standard: "claude-sonnet-4-6",
  deep: "claude-sonnet-4-6",
};
const MAX_TOKENS = { light: 400, standard: 1000, deep: 1600 };

const LIMIT_USER = Number(process.env.DAILY_CALL_LIMIT_USER || 300);
const LIMIT_ANON = Number(process.env.DAILY_CALL_LIMIT_ANON || 50);
const anonCounts = globalThis.__zhiveAnonCounts || (globalThis.__zhiveAnonCounts = new Map());

async function checkQuota(req) {
  const day = new Date().toISOString().slice(0, 10);
  const supaUrl = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  // Signed-in path: verify the token, count today's api_call events.
  if (token && supaUrl && svc) {
    try {
      const uRes = await fetch(`${supaUrl}/auth/v1/user`, {
        headers: { apikey: svc, Authorization: `Bearer ${token}` },
      });
      if (uRes.ok) {
        const user = await uRes.json();
        const cRes = await fetch(
          `${supaUrl}/rest/v1/events?select=id&type=eq.api_call&user_id=eq.${user.id}&created_at=gte.${day}T00:00:00Z`,
          { method: "HEAD", headers: { apikey: svc, Authorization: `Bearer ${svc}`, Prefer: "count=exact" } }
        );
        const count = Number((cRes.headers.get("content-range") || "/0").split("/")[1] || 0);
        if (count >= LIMIT_USER) {
          return { blocked: `Daily usage limit reached (${LIMIT_USER} calls). It resets at midnight UTC.` };
        }
        // Record this call (fire-and-forget insert, awaited to survive serverless suspension).
        await fetch(`${supaUrl}/rest/v1/events`, {
          method: "POST",
          headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ type: "api_call", user_id: user.id }),
        }).catch(() => {});
        return { userId: user.id };
      }
    } catch { /* fall through to anonymous limits */ }
  }

  // Anonymous/demo path: per-IP, in-memory.
  const ip = String(req.headers["x-forwarded-for"] || "anon").split(",")[0].trim();
  const key = ip + "|" + day;
  const n = anonCounts.get(key) || 0;
  if (n >= LIMIT_ANON) {
    return { blocked: `Demo usage limit reached for today. Create a free account for a much higher daily limit.` };
  }
  anonCounts.set(key, n + 1);
  if (anonCounts.size > 5000) anonCounts.clear(); // crude memory guard
  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY is not set in Vercel environment variables." } });
  }
  try {
    const { tier = "standard", system, messages, stream = false, webSearch = false, maxTokens } = req.body || {};

    const quota = await checkQuota(req);
    if (quota.blocked) return res.status(429).json({ error: { message: quota.blocked } });

    // ——— Readiness Lab credit gate: web-search calls are premium ———
    if (webSearch) {
      const supaUrl = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!quota.userId || !supaUrl || !svc) {
        return res.status(403).json({ error: { message: "The Readiness Lab needs a full (free) account — the 24h demo can't run it." } });
      }
      const pRes = await fetch(`${supaUrl}/rest/v1/profiles?select=lab_credits&id=eq.${quota.userId}`, {
        headers: { apikey: svc, Authorization: `Bearer ${svc}` },
      });
      const [prof] = await pRes.json();
      const credits = prof?.lab_credits ?? 0;
      if (credits <= 0) {
        return res.status(402).json({ error: { message: "You've used your Lab credits. Top up from the pricing section on the Lab page — your report picks up right where you left off." } });
      }
      await fetch(`${supaUrl}/rest/v1/profiles?id=eq.${quota.userId}`, {
        method: "PATCH",
        headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ lab_credits: credits - 1 }),
      }).catch(() => {});
    }

    const t = MODELS[tier] ? tier : "standard";
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELS[t],
        max_tokens: Math.min(Number(maxTokens) || MAX_TOKENS[t], 3200),
        system,
        messages,
        // Readiness Lab agents use live web search so regulatory claims cite current sources.
        ...(webSearch ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] } : {}),
        ...(stream && !webSearch ? { stream: true } : {}),
      }),
    });

    // Non-streaming path (and any upstream error) — return plain JSON as before.
    if (!stream || webSearch || !upstream.ok || !upstream.body) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    // Streaming path — forward the SSE bytes chunk-for-chunk.
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    const reader = upstream.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
      if (typeof res.flush === "function") res.flush();
    }
    res.end();
  } catch (e) {
    if (!res.headersSent) return res.status(500).json({ error: { message: e.message || "Proxy error" } });
    try { res.end(); } catch { /* stream already closed */ }
  }
}
