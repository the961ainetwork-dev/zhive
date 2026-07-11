// api/admin.js — Vercel serverless function for the /admin dashboard.
// Verifies ADMIN_PASSWORD, then reads users + orders with the Supabase service-role key.
// Secrets stay server-side; the client never sees the service key.

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: "ADMIN_PASSWORD env var not set." });
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Wrong password." });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars not set." });

  try {
    const admin = createClient(url, key, { auth: { persistSession: false } });

    const [{ data: profiles }, { data: orders }, { data: purchases }, { data: events }] = await Promise.all([
      admin.from("profiles").select("id, name, email, created_at"),
      admin.from("orders").select("ref, email, items, total, created_at").order("created_at", { ascending: false }),
      admin.from("purchases").select("user_id"),
      admin.from("events").select("type, user_id"),
    ]);

    const counts = {};
    (purchases || []).forEach((p) => { counts[p.user_id] = (counts[p.user_id] || 0) + 1; });

    const evs = events || [];
    const accounts = (profiles || []).length;
    const payingIds = new Set((purchases || []).map((p) => p.user_id));
    const runEvents = evs.filter((e) => e.type === "run");
    const ranIds = new Set(runEvents.filter((e) => e.user_id).map((e) => e.user_id));
    const metrics = {
      accounts,
      paying: payingIds.size,
      runs: runEvents.length,
      demos: evs.filter((e) => e.type === "demo_start").length,
      activationPct: accounts ? Math.round(((profiles || []).filter((p) => ranIds.has(p.id)).length / accounts) * 100) : 0,
      payingPct: accounts ? Math.round((payingIds.size / accounts) * 100) : 0,
      runsPerAccount: accounts ? (runEvents.length / accounts).toFixed(1) : "0",
    };

    return res.status(200).json({
      metrics,
      users: (profiles || []).map((p) => ({
        name: p.name || "—",
        email: p.email,
        created: new Date(p.created_at).getTime(),
        purchases: counts[p.id] || 0,
      })),
      orders: (orders || []).map((o) => ({
        id: o.ref,
        email: o.email,
        items: o.items,
        total: o.total,
        date: new Date(o.created_at).getTime(),
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Admin query failed." });
  }
}
