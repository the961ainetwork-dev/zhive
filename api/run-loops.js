// Vercel Cron worker — executes due scheduled loops server-side.
// Schedule: see vercel.json ("crons"). Runs daily; each loop's cadence decides if it's due.
// Security: if CRON_SECRET is set in env, Vercel sends "Authorization: Bearer <CRON_SECRET>"
// with cron invocations and we reject anything else.
// Guardrails (per the Loop Engineering paper): hard iteration ceilings (1 QA revision max,
// 3 agents per chain, 5 loops per invocation), fixed token budgets per tier, graceful fallbacks.

export const config = { maxDuration: 300 };

const MODELS = {
  light: "claude-haiku-4-5-20251001",
  standard: "claude-sonnet-4-6",
  deep: "claude-sonnet-4-6",
};
const MAX_TOKENS = { light: 400, standard: 1000, deep: 1600 };
const MAX_LOOPS_PER_TICK = 5;
const MAX_AGENTS_PER_CHAIN = 3;
// Due thresholds with slack for cron jitter:
const DUE_MS = { daily: 20 * 3600e3, weekly: 6.5 * 86400e3 };

async function claude(tier, system, messages) {
  const t = MODELS[tier] ? tier : "standard";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODELS[t], max_tokens: MAX_TOKENS[t], system, messages }),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

const bizContext = (biz) =>
  biz && (biz.product || biz.market || biz.tone || biz.goals)
    ? `Business profile (applies to all work):\n- Product/service: ${biz.product || "—"}\n- Primary market: ${biz.market || "—"}\n- Tone & language: ${biz.tone || "—"}\n- Goals: ${biz.goals || "—"}\n\n`
    : "";

// Same quality loop as the live product: draft → light QA → one revision max.
async function runAgent(agent, input, biz, examples) {
  const exBlock = examples?.length
    ? `Style guide — work this founder previously approved. Match its tone, specificity, language and format (do not copy its content):\n${examples.map((e, i) => `--- approved example ${i + 1} ---\n${String(e).slice(0, 900)}`).join("\n")}\n--- end examples ---\n\n`
    : "";
  const userMsg = `${bizContext(biz)}${exBlock}Task from the founder:\n${input}\n\nProduce your specialist work now.`;
  let text = await claude(agent.tier || "standard", agent.system, [{ role: "user", content: userMsg }]);
  let qa = "checked";
  try {
    const verdict = await claude("light",
      "You are the QA agent at zhive.xyz. Review the specialist output against this rubric: specific (real names/numbers, no filler), stays on specialty, ends with concrete next actions, matches any requested language or tone. Reply with exactly PASS, or REVISE: <one line of concrete feedback>.",
      [{ role: "user", content: `Task:\n${userMsg.slice(0, 1500)}\n\nOutput:\n${text.slice(0, 3000)}` }]);
    if (verdict.trim().toUpperCase().startsWith("REVISE")) {
      const feedback = verdict.replace(/^REVISE:?/i, "").trim();
      text = await claude(agent.tier || "standard", agent.system, [
        { role: "user", content: userMsg },
        { role: "assistant", content: text },
        { role: "user", content: `QA feedback: ${feedback}\nRevise your work accordingly. Output only the revised work.` },
      ]);
      qa = "revised";
    } else qa = "passed";
  } catch { /* QA best-effort */ }
  return { text, qa };
}

const handoffInput = (from, to, originalTask, prevText) =>
  `HANDOFF · ${from.name} → ${to.name}\nOriginal task from the founder:\n${originalTask}\n\nDelivered work from ${from.name} (already shown to the founder — do not repeat it):\n${prevText.slice(0, 4000)}\n\nContinue the job strictly within your own specialty: build on this work, fill what it leaves open, and keep your brief self-contained.`;

function supa(path, opts = {}) {
  const url = process.env.SUPABASE_URL, svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json",
      Prefer: opts.method === "POST" ? "return=minimal" : "return=representation",
      ...(opts.headers || {}),
    },
  });
}

async function emailDigest(to, loopName, steps) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const from = process.env.LOOP_EMAIL_FROM || "zhive <onboarding@resend.dev>";
  const body = steps.map((s, i) => `${"—".repeat(30)}\n${i + 1}. ${s.name} (QA: ${s.qa})\n${"—".repeat(30)}\n\n${s.text}`).join("\n\n");
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to,
        subject: `Your zhive loop ran: ${loopName}`,
        text: `Your scheduled pipeline "${loopName}" just completed on zhive.xyz.\n\n${body}\n\nManage your loops: https://www.zhive.xyz/workspace`,
      }),
    });
  } catch { /* email is best-effort */ }
}

export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY" } });
  }

  try {
    const now = Date.now();
    const lRes = await supa(`loops?select=*&active=eq.true&order=last_run.asc.nullsfirst&limit=50`);
    const all = await lRes.json();
    const due = (Array.isArray(all) ? all : []).filter((l) => {
      const thresh = DUE_MS[l.cadence] || DUE_MS.daily;
      return !l.last_run || now - new Date(l.last_run).getTime() > thresh;
    }).slice(0, MAX_LOOPS_PER_TICK);

    const results = [];
    for (const loop of due) {
      // Mark last_run first — even a failed run shouldn't retry until the next cadence window.
      await supa(`loops?id=eq.${loop.id}`, { method: "PATCH", body: JSON.stringify({ last_run: new Date().toISOString() }) });
      try {
        // Fresh business profile + email at run time.
        const pRes = await supa(`profiles?select=email,business&id=eq.${loop.user_id}`);
        const [profile] = await pRes.json();
        const agents = (loop.agents || []).slice(0, MAX_AGENTS_PER_CHAIN);
        const steps = [];
        for (let i = 0; i < agents.length; i++) {
          const input = i === 0 ? loop.input : handoffInput(agents[i - 1], agents[i], loop.input, steps[i - 1].text);
          let examples = [];
          try {
            const fRes = await supa(`feedback?select=excerpt&user_id=eq.${loop.user_id}&agent_id=eq.${encodeURIComponent(agents[i].id)}&verdict=eq.up&order=created_at.desc&limit=2`);
            examples = ((await fRes.json()) || []).map((f) => f.excerpt);
          } catch { /* optional */ }
          const r = await runAgent(agents[i], input, profile?.business, examples);
          steps.push({ id: agents[i].id, name: agents[i].name, text: r.text, qa: r.qa });
        }
        await supa("runs", { method: "POST", body: JSON.stringify({ loop_id: loop.id, user_id: loop.user_id, status: "ok", steps }) });
        await supa("events", { method: "POST", body: JSON.stringify({ type: "loop_run", user_id: loop.user_id }) });
        await emailDigest(profile?.email, loop.name, steps);
        results.push({ loop: loop.name, status: "ok", steps: steps.length });
      } catch (e) {
        await supa("runs", { method: "POST", body: JSON.stringify({ loop_id: loop.id, user_id: loop.user_id, status: "error", steps: [{ name: "system", text: e.message || "Run failed", qa: "checked" }] }) });
        results.push({ loop: loop.name, status: "error", error: e.message });
      }
    }
    return res.status(200).json({ checked: all.length || 0, executed: results });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message || "Cron error" } });
  }
}
