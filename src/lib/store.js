// src/lib/store.js — data layer for zhive.xyz
// Uses Supabase (auth + Postgres) when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set.
// Falls back to an in-memory prototype store otherwise, so the app always runs.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
let sb = null;
try {
  sb = url && anon ? createClient(url, anon) : null;
} catch (e) {
  console.error("Supabase config invalid — running in prototype mode:", e);
  sb = null;
}
export const isCloud = Boolean(sb);
// ——— in-memory fallback (prototype mode) ———
const mem = {
  users: [
    { id: "u-sample", email: "sample@founder.lb", name: "Sample Founder", pass: "•", created: Date.now() - 86400000 * 3, purchases: ["market-research", "finance-agent"], biz: null },
  ],
  orders: [
    { id: "Z-1001", email: "sample@founder.lb", user_id: "u-sample", items: ["Market Research", "Finance Agent"], total: 128, date: Date.now() - 86400000 * 2, sample: true },
  ],
  events: [
    { type: "signup", user_id: "u-sample", t: Date.now() - 86400000 * 3 },
    { type: "run", user_id: "u-sample", t: Date.now() - 86400000 * 2 },
    { type: "purchase", user_id: "u-sample", t: Date.now() - 86400000 * 2 },
  ],
  pipelines: [],
  feedback: [],
};

function memMetrics() {
  const accounts = mem.users.length;
  const paying = mem.users.filter((u) => u.purchases.length > 0).length;
  const runs = mem.events.filter((e) => e.type === "run").length;
  const ranIds = new Set(mem.events.filter((e) => e.type === "run" && e.user_id).map((e) => e.user_id));
  const activated = mem.users.filter((u) => ranIds.has(u.id)).length;
  const demos = mem.events.filter((e) => e.type === "demo_start").length;
  return {
    accounts, paying, runs, demos,
    activationPct: accounts ? Math.round((activated / accounts) * 100) : 0,
    payingPct: accounts ? Math.round((paying / accounts) * 100) : 0,
    runsPerAccount: accounts ? (runs / accounts).toFixed(1) : "0",
  };
}

const sessionFromUser = (u) => ({ id: u.id, email: u.email, name: u.user_metadata?.name || u.email.split("@")[0], demo: false });

export const store = {
  /** Subscribe to auth state. Returns an unsubscribe fn. */
  init(cb) {
    if (!isCloud) { cb(null); return () => {}; }
    sb.auth.getSession().then(({ data }) => cb(data.session ? sessionFromUser(data.session.user) : null));
    const { data: sub } = sb.auth.onAuthStateChange((_ev, s) => cb(s ? sessionFromUser(s.user) : null));
    return () => sub.subscription.unsubscribe();
  },

  async signUp(name, email, pass) {
    if (!name || !email.includes("@") || pass.length < 6) return { error: "Fill all fields (password ≥ 6 chars)." };
    if (!isCloud) {
      if (mem.users.some((u) => u.email === email)) return { error: "An account with this email already exists." };
      const u = { id: "u-" + Date.now(), email, name, pass, created: Date.now(), purchases: [] };
      mem.users.push(u);
      return { session: { id: u.id, email, name, demo: false } };
    }
    const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { name } } });
    if (error) return { error: error.message };
    if (!data.session) return { pending: true }; // email confirmation is on
    await sb.from("profiles").upsert({ id: data.user.id, email, name });
    return { session: sessionFromUser(data.user) };
  },

  async signIn(email, pass) {
    if (!isCloud) {
      const u = mem.users.find((x) => x.email === email && x.pass === pass);
      return u ? { session: { id: u.id, email: u.email, name: u.name, demo: false } } : { error: "Wrong email or password." };
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: error.message };
    await sb.from("profiles").upsert({ id: data.user.id, email, name: data.user.user_metadata?.name || "" });
    return { session: sessionFromUser(data.user) };
  },

  async signOut() {
    if (isCloud) await sb.auth.signOut();
  },

  async getPurchases(session) {
    if (!isCloud) return mem.users.find((u) => u.id === session.id)?.purchases || [];
    const { data } = await sb.from("purchases").select("agent_id").eq("user_id", session.id);
    return (data || []).map((r) => r.agent_id);
  },

  async getMyOrders(session) {
    if (!isCloud) return mem.orders.filter((o) => o.user_id === session.id || o.email === session.email);
    const { data } = await sb.from("orders").select("*").eq("user_id", session.id).order("created_at", { ascending: false });
    return (data || []).map((o) => ({ id: o.ref, items: o.items, total: o.total, date: new Date(o.created_at).getTime() }));
  },

  async addOrder(session, itemNames, itemIds, total) {
    const ref = "Z-" + Math.floor(1000 + Math.random() * 9000);
    if (!isCloud) {
      const order = { id: ref, email: session.email, user_id: session.id, items: itemNames, total, date: Date.now() };
      mem.orders.push(order);
      const u = mem.users.find((x) => x.id === session.id);
      if (u) u.purchases = [...new Set([...u.purchases, ...itemIds])];
      return { order };
    }
    const { error } = await sb.from("orders").insert({ ref, user_id: session.id, email: session.email, items: itemNames, total });
    if (error) return { error: error.message };
    await sb.from("purchases").upsert(itemIds.map((agent_id) => ({ user_id: session.id, agent_id })), { onConflict: "user_id,agent_id", ignoreDuplicates: true });
    return { order: { id: ref, items: itemNames, total, date: Date.now() } };
  },

  // ——— business profile (one intake, shared by every agent) ———
  async getBiz(session) {
    if (!isCloud) return mem.users.find((u) => u.id === session.id)?.biz || null;
    const { data } = await sb.from("profiles").select("business").eq("id", session.id).single();
    return data?.business || null;
  },

  async saveBiz(session, biz) {
    if (!isCloud) {
      const u = mem.users.find((x) => x.id === session.id);
      if (u) u.biz = biz;
      return {};
    }
    const { error } = await sb.from("profiles").update({ business: biz }).eq("id", session.id);
    return error ? { error: error.message } : {};
  },

  // ——— event logging (activation, runs, demo→paid) ———
  async logEvent(type, session) {
    try {
      if (!isCloud) { mem.events.push({ type, user_id: session && !session.demo ? session.id : null, t: Date.now() }); return; }
      await sb.from("events").insert({ type, user_id: session && !session.demo ? session.id : null });
    } catch { /* metrics are best-effort */ }
  },

  /** Current Supabase access token (cloud mode) — sent to /api/agent for quota enforcement. */
  async getToken() {
    if (!isCloud) return null;
    try {
      const { data } = await sb.auth.getSession();
      return data.session?.access_token || null;
    } catch { return null; }
  },

  // ——— saved pipelines (reusable agent chains) ———
  // Demo sessions aren't real Supabase users, so their pipelines live in memory (24h anyway).
  async getPipelines(session) {
    if (!session) return [];
    if (!isCloud || session.demo) return mem.pipelines.filter((p) => p.user_id === session.id);
    const { data } = await sb.from("pipelines").select("*").eq("user_id", session.id).order("created_at", { ascending: false });
    return (data || []).map((p) => ({ id: p.id, name: p.name, agentIds: p.agent_ids }));
  },

  async savePipeline(session, name, agentIds) {
    if (!name?.trim() || !agentIds?.length) return { error: "Give the pipeline a name." };
    if (!isCloud || session.demo) {
      const p = { id: "pl-" + Date.now(), user_id: session.id, name: name.trim(), agentIds };
      mem.pipelines.unshift(p);
      return { pipeline: p };
    }
    const { data, error } = await sb.from("pipelines").insert({ user_id: session.id, name: name.trim(), agent_ids: agentIds }).select().single();
    if (error) return { error: error.message };
    return { pipeline: { id: data.id, name: data.name, agentIds: data.agent_ids } };
  },

  async deletePipeline(session, id) {
    if (!isCloud || session.demo) { mem.pipelines = mem.pipelines.filter((p) => p.id !== id); return {}; }
    const { error } = await sb.from("pipelines").delete().eq("id", id).eq("user_id", session.id);
    return error ? { error: error.message } : {};
  },

  // ——— Readiness Lab credits (server-enforced; this is display only) ———
  async getLabCredits(session) {
    if (!isCloud || !session || session.demo) return null;
    const { data } = await sb.from("profiles").select("lab_credits").eq("id", session.id).single();
    return data?.lab_credits ?? 0;
  },

  // ——— verify & learn (Phase 3): thumbs feedback + approved-style examples ———
  async saveFeedback(session, { agentId, verdict, text, task }) {
    if (!session) return { error: "Sign in first" };
    const row = { agent_id: agentId, verdict, excerpt: (text || "").slice(0, 1200), task_excerpt: (task || "").slice(0, 300) };
    if (!isCloud || session.demo) { mem.feedback.unshift({ ...row, user_id: session.id }); return {}; }
    const { error } = await sb.from("feedback").insert({ ...row, user_id: session.id });
    return error ? { error: error.message } : {};
  },

  // Latest 👍 outputs for this agent — injected into future prompts as a style guide.
  async getLikedExamples(session, agentId, limit = 2) {
    if (!session) return [];
    if (!isCloud || session.demo) {
      return mem.feedback
        .filter((f) => f.user_id === session.id && f.agent_id === agentId && f.verdict === "up")
        .slice(0, limit).map((f) => f.excerpt);
    }
    const { data } = await sb.from("feedback").select("excerpt")
      .eq("user_id", session.id).eq("agent_id", agentId).eq("verdict", "up")
      .order("created_at", { ascending: false }).limit(limit);
    return (data || []).map((d) => d.excerpt);
  },

  // ——— scheduled loops (Phase 2: pipelines on a cadence, run by Vercel Cron) ———
  // Cloud + real accounts only: the cron worker needs a real user row to attribute runs to.
  loopsAvailable(session) { return isCloud && session && !session.demo; },

  async getLoops(session) {
    if (!this.loopsAvailable(session)) return [];
    const { data } = await sb.from("loops").select("*").eq("user_id", session.id).order("created_at", { ascending: false });
    return data || [];
  },

  async createLoop(session, { name, agents, input, cadence }) {
    if (!this.loopsAvailable(session)) return { error: "Scheduled loops need a full (free) account." };
    const { data, error } = await sb.from("loops")
      .insert({ user_id: session.id, name, agents, input, cadence: cadence === "weekly" ? "weekly" : "daily" })
      .select().single();
    return error ? { error: error.message } : { loop: data };
  },

  async setLoopActive(session, id, active) {
    if (!this.loopsAvailable(session)) return { error: "Not available" };
    const { error } = await sb.from("loops").update({ active }).eq("id", id).eq("user_id", session.id);
    return error ? { error: error.message } : {};
  },

  async deleteLoop(session, id) {
    if (!this.loopsAvailable(session)) return { error: "Not available" };
    const { error } = await sb.from("loops").delete().eq("id", id).eq("user_id", session.id);
    return error ? { error: error.message } : {};
  },

  async getLoopRuns(session, limit = 10) {
    if (!this.loopsAvailable(session)) return [];
    const { data } = await sb.from("runs").select("*").eq("user_id", session.id).order("created_at", { ascending: false }).limit(limit);
    return data || [];
  },

  /** Admin data. Cloud mode verifies the password server-side via /api/admin. */
  async adminFetch(password) {
    if (!isCloud) {
      if (password !== "zhive2026") return { error: "Wrong password." };
      return {
        users: mem.users.map((u) => ({ name: u.name, email: u.email, created: u.created, purchases: u.purchases.length })),
        orders: mem.orders.map((o) => ({ ...o })),
        metrics: memMetrics(),
      };
    }
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Admin auth failed." };
    return data;
  },
};
