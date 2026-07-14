import React, { useState, useEffect } from "react";
import { store, isCloud } from "./lib/store.js";
import LoopLab from "./LoopLab.jsx";
import HappeningNow from "./HappeningNow.jsx";
// ——— i18n: Arabic-first experience ———
// LANG is set from state on every render of the root app; t(en, ar) picks the string.
// UI chrome is translated here; long-form content (essays, agent case studies) stays EN for now.
const LANG_KEY = "zhive-lang";
let LANG = "en";
const t = (en, ar) => (LANG === "ar" ? ar : en);

// ————————————————————————————————————————————————————————
// ZHIVE.XYZ — the AI operating hive for startups · MENA-first
// Black-on-white minimalist · horizontal accordion sections
// Prototype note: all data lives in memory (resets on refresh)
// Admin password: zhive2026
// ————————————————————————————————————————————————————————

const ADMIN_PASS = "zhive2026";
const DEMO_MS = 24 * 60 * 60 * 1000; // 24 hours

const STEPS = [
  { n: "01", icon: "📋", title: "Business intake", desc: "Fill in your business data — product, supplier, revenue, market, goals. Takes 3 minutes." },
  { n: "02", icon: "🚀", title: "Launch 5 agents", desc: "One click deploys all 5 specialist AI agents simultaneously. Watch them run in real time." },
  { n: "03", icon: "🧠", title: "AI analysis", desc: "Each agent runs deep analysis — market scans, supplier benchmarks, cost models, logistics checks, growth plans." },
  { n: "04", icon: "📄", title: "Full COO report", desc: "A unified strategic report with immediate actions, opportunity map, and 7-day implementation plan." },
];

const LAYERS = [
  { n: "L1", name: "Executive Intelligence", price: 99, desc: "The brain of the hive — strategy and foresight.", agents: ["Strategic Planner", "KPI Monitor", "Forecasting Agent", "Decision Support", "Board Reporter"] },
  { n: "L2", name: "Revenue Engine", price: 79, desc: "Everything that finds, wins, and keeps customers.", agents: ["Lead Generator", "Sales Automator", "CRM Manager", "Customer Success", "Marketing Orchestrator", "Pricing Agent"] },
  { n: "L3", name: "Operations Engine", price: 69, desc: "The back office that runs itself.", agents: ["Finance Agent", "HR Agent", "Legal & Compliance", "Workflow Automator", "Internal Comms", "Procurement Agent"] },
  { n: "L4", name: "Product & Engineering", price: 89, desc: "From roadmap to shipped code.", agents: ["Product Manager", "Software Developer", "QA Agent", "DevOps Agent", "Documentation Agent", "UX Researcher"] },
  { n: "L5", name: "Knowledge & Intelligence", price: 59, desc: "The hive's collective memory and radar.", agents: ["Knowledge Manager", "Enterprise Search", "Competitor Intelligence", "Market Research", "Analytics Agent"] },
  { n: "L6", name: "AI Infrastructure", price: 49, desc: "The substrate every agent runs on.", agents: ["Model Router", "Prompt Manager", "Memory Store", "Governance Agent", "Security Agent", "Observability", "Cost Optimizer"] },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// full agent catalog with generated page content
const LAYER_AGENTS = LAYERS.flatMap((L) =>
  L.agents.map((name) => ({
    id: slug(name),
    name,
    layer: L.n,
    layerName: L.name,
    price: L.price,
    tier: L.n === "L1" ? "deep" : "standard",
    tagline: `Your always-on ${name.toLowerCase()} — tuned for Lebanon and the Middle East.`,
    synopsis: [
      `Operates as a specialist ${name.toLowerCase()} inside the ${L.name} layer, reporting into the hive's shared memory.`,
      `Trained on MENA business realities — Lebanon's fresh-USD economy, GCC regulation, WhatsApp-first commerce, regional supplier corridors.`,
      `Produces decision-ready briefs, not raw data — every output ends in recommended actions.`,
      `Hands work to adjacent agents in the hive (e.g. findings flow to the COO report automatically).`,
    ],
    caseStudy: {
      title:
        L.n === "L2" ? "Beirut D2C skincare brand → +38% qualified leads in 60 days"
        : L.n === "L3" ? "Tripoli food exporter → 22% cost reduction on GCC shipments"
        : L.n === "L4" ? "Dubai SaaS team → release cycle cut from 3 weeks to 4 days"
        : L.n === "L5" ? "Riyadh retail chain → competitor price moves detected 48h earlier"
        : L.n === "L6" ? "Regional fintech → 41% lower AI spend with zero quality loss"
        : "Beirut logistics startup → board-ready forecasts in 20 minutes, not 2 weeks",
      body: `A founder-led team in the region deployed the ${name} as part of a ${L.name} bundle. Within the first month it replaced ad-hoc spreadsheets and consultant hours with a continuous, auditable workflow — with every output feeding the unified COO report. Results shown are from the pilot cohort; your numbers will vary with input quality and market.`,
    },
    implementation: [
      "Week 1 — connect your intake data (product, suppliers, revenue, goals) and run the first baseline brief.",
      "Week 2 — calibrate: redirect the agent with follow-ups until outputs match your operating reality.",
      "Week 3 — wire handoffs: route its outputs to the COO report and adjacent hive agents.",
      "Ongoing — review weekly; the agent keeps memory of every prior brief in your workspace.",
    ],
    system: `You are the ${name} agent at zhive.xyz, an AI operating hive for startups, part of the ${L.name} layer. You have deep MENA expertise: Lebanon's dual-currency fresh-USD economy, GCC market dynamics, regional funders (Berytech, Flat6Labs, MEVP, Shorooq), WhatsApp-first commerce, and Levant/GCC supplier and logistics corridors. Given a business description, deliver a concise, decision-ready ${name.toLowerCase()} brief in markdown (## headers, bullets) strictly within your specialty. End with a "## Next actions" section of 3 concrete steps. Max ~350 words. Concrete names and numbers over generalities.`,
  }))
);

// ——— rentable agent directory — hire a single specialist on demand ———
const DIR_LIST = [
  { cat: "Marketing & Content", price: 39, names: ["Social Media Manager", "SEO Agent", "Content Writer", "Email Marketing Agent", "Ads Manager", "PR & Media Agent"] },
  { cat: "Sales & Support", price: 35, names: ["Customer Support Agent", "Business Development Agent", "Community Manager"] },
  { cat: "Finance & Admin", price: 45, names: ["Bookkeeper Agent", "Tax & VAT Agent", "Payroll Agent"] },
  { cat: "Talent", price: 35, names: ["Recruiter Agent", "Onboarding Agent"] },
  { cat: "Regional Specialists", price: 49, names: ["Arabic Localization Agent", "Import & Export Agent", "Fundraising & Pitch Agent", "Grant Writer Agent"] },
  { cat: "E-commerce", price: 39, names: ["E-commerce Manager", "Inventory Agent"] },
];
const DIR_CASE = {
  "Marketing & Content": "Beirut café chain → 3× Instagram engagement and a full month of content planned in one afternoon",
  "Sales & Support": "Amman SaaS startup → first-response time cut from 6 hours to 40 seconds",
  "Finance & Admin": "Lebanese trading SARL → monthly close done in 2 days, VAT filings never late again",
  "Talent": "Dubai startup → 120 applicants screened to a 5-person shortlist overnight",
  "Regional Specialists": "Diaspora-founded brand → full Arabic storefront and GCC customs paperwork ready in one week",
  "E-commerce": "Tripoli fashion store → stockouts down 60% with weekly demand forecasts",
};
const DIR_AGENTS = DIR_LIST.flatMap((C) =>
  C.names.map((name) => ({
    id: slug(name),
    name,
    layer: "DIR",
    layerName: C.cat,
    price: C.price,
    tier: "standard",
    rentable: true,
    tagline: `Rent an always-on ${name.toLowerCase()} — tuned for Lebanon and the Middle East. No hiring, no contracts, cancel monthly.`,
    synopsis: [
      `A single-role specialist you rent by the month — does the job of a ${name.toLowerCase()} without the headcount.`,
      `MENA-native by default: Arabic/French/English output, fresh-USD pricing awareness, WhatsApp-first workflows, regional platforms and regulations.`,
      `Produces finished work — posts, replies, filings, shortlists, forecasts — not just advice, each ending in next actions.`,
      `Plugs into the hive: rented agents share memory with your workspace and feed the unified COO report.`,
    ],
    caseStudy: {
      title: DIR_CASE[C.cat],
      body: `A regional team rented the ${name} for one month as a trial. It took over the recurring ${C.cat.toLowerCase()} workload from day one, working from a short intake and weekly redirects — at a fraction of a freelancer's cost. Results shown are from the pilot cohort; your numbers will vary with input quality and market.`,
    },
    implementation: [
      "Day 1 — 10-minute intake: your business, tone, constraints, and this month's priority.",
      "Days 2–7 — first deliverables land in your workspace; redirect the agent until output matches your voice and reality.",
      "Week 2+ — move to a weekly cadence: the agent proposes, you approve, it executes.",
      "Anytime — pause or cancel the rental from your workspace; all past work stays yours.",
    ],
    system: `You are the ${name} at zhive.xyz, a rentable specialist agent in the ${C.cat} category. You have deep MENA expertise: Lebanon's dual-currency fresh-USD economy, GCC market dynamics, Arabic/French/English trilingual audiences, WhatsApp-first commerce, and regional platforms, regulations, and suppliers. Given a business description, deliver concrete, finished ${name.toLowerCase()} work product in markdown (## headers, bullets) strictly within your specialty — actual drafts, plans, or analyses, not generic advice. End with a "## Next actions" section of 3 concrete steps. Max ~350 words.`,
  }))
);

const AGENTS = [...LAYER_AGENTS, ...DIR_AGENTS];

// ——— outcome bundles: rent results, not org charts ———
const BUNDLES = [
  { id: "pack-launch", bundle: true, name: "Launch Pack", price: 99, sum: 156,
    outcome: "Get your first 100 customers",
    items: ["social-media-manager", "content-writer", "ads-manager", "email-marketing-agent"] },
  { id: "pack-backoffice", bundle: true, name: "Back-Office Pack", price: 89, sum: 135,
    outcome: "Get admin off your plate",
    items: ["bookkeeper-agent", "tax-vat-agent", "payroll-agent"] },
  { id: "pack-gcc", bundle: true, name: "GCC Expansion Pack", price: 89, sum: 133,
    outcome: "Open the Gulf corridor",
    items: ["arabic-localization-agent", "import-export-agent", "business-development-agent"] },
];

const getAgent = (id) => AGENTS.find((a) => a.id === id);
const getItem = (id) => BUNDLES.find((b) => b.id === id) || getAgent(id);
const expandItems = (ids) => [...new Set(ids.flatMap((id) => { const it = getItem(id); return it?.bundle ? it.items : [id]; }))];

// ——— tiny markdown renderer ———
function renderInline(text, key) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={key + i}>{p.slice(2, -2)}</strong> : p
  );
}
function Markdown({ text }) {
  if (!text) return null;
  const out = [];
  let buf = [];
  const flush = (k) => {
    if (buf.length) {
      out.push(<ul key={"u" + k}>{buf.map((li, i) => <li key={i}>{renderInline(li, k + "" + i)}</li>)}</ul>);
      buf = [];
    }
  };
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (/^#{1,4}\s/.test(line)) { flush(i); out.push(<h4 key={"h" + i} className="md-h">{line.replace(/^#{1,4}\s/, "")}</h4>); }
    else if (/^[-*•]\s/.test(line)) buf.push(line.replace(/^[-*•]\s/, ""));
    else if (/^\d+[.)]\s/.test(line)) buf.push(line.replace(/^\d+[.)]\s/, ""));
    else if (line === "") flush(i);
    else { flush(i); out.push(<p key={"p" + i}>{renderInline(line, "p" + i)}</p>); }
  });
  flush("e");
  return <div className="md">{out}</div>;
}

// ——— API ———
async function callClaude(system, messages, tier = "standard") {
  // Calls the Vercel serverless proxy (api/agent.js), which holds the API key
  // and routes tiers to right-sized models (light → fast/cheap, deep → synthesis).
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: await apiHeaders(),
    body: JSON.stringify({ tier, system, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

// Attach the Supabase access token (cloud mode) so the API can enforce daily quotas.
async function apiHeaders() {
  const h = { "Content-Type": "application/json" };
  try { const t = await store.getToken(); if (t) h.Authorization = `Bearer ${t}`; } catch { /* anonymous */ }
  return h;
}

// Streaming variant — renders tokens as they arrive. Falls back transparently to a
// plain JSON response if the platform doesn't stream (e.g. some local setups).
async function callClaudeStream(system, messages, tier = "standard", onDelta) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: await apiHeaders(),
    body: JSON.stringify({ tier, system, messages, stream: true }),
  });
  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("text/event-stream")) {
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API error");
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    if (onDelta) onDelta(text);
    return text;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "", full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop(); // keep any trailing partial line for the next chunk
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      let ev;
      try { ev = JSON.parse(payload); } catch { continue; }
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
        full += ev.delta.text;
        if (onDelta) onDelta(full);
      } else if (ev.type === "error") {
        throw new Error(ev.error?.message || "Stream error");
      }
    }
  }
  if (!full) throw new Error("Empty response — try again");
  return full;
}

// Build the shared-profile context every agent reads automatically.
const bizContext = (biz) =>
  biz && (biz.product || biz.market || biz.tone || biz.goals)
    ? `Business profile (applies to all work):\n- Product/service: ${biz.product || "—"}\n- Primary market: ${biz.market || "—"}\n- Tone & language: ${biz.tone || "—"}\n- Goals: ${biz.goals || "—"}\n\n`
    : "";

// The quality loop, now streamed: live draft → light-tier QA review → one live revision if needed.
// onUpdate({ phase, text }) fires as tokens arrive; phase ∈ "drafting" | "qa" | "revising".
async function runAgentTask(agent, input, biz, onUpdate, examples) {
  const exBlock = examples?.length
    ? `Style guide — work this founder previously approved. Match its tone, specificity, language and format (do not copy its content):\n${examples.map((e, i) => `--- approved example ${i + 1} ---\n${String(e).slice(0, 900)}`).join("\n")}\n--- end examples ---\n\n`
    : "";
  const langDirective = LANG === "ar"
    ? `\n\nاللغة: اكتب الناتج بالكامل باللغة العربية (فصحى مبسّطة مناسبة للأعمال، مع إبقاء المصطلحات التقنية الإنجليزية عند الحاجة)، إلا إذا حدّد المؤسس لغة أخرى في ملف النشاط أو نص المهمة.`
    : "";
  const userMsg = `${bizContext(biz)}${exBlock}Task from the founder:\n${input}\n\nProduce your specialist work now.${langDirective}`;
  if (onUpdate) onUpdate({ phase: "drafting", text: "" });
  let text = await callClaudeStream(
    agent.system,
    [{ role: "user", content: userMsg }],
    agent.tier || "standard",
    (t) => onUpdate && onUpdate({ phase: "drafting", text: t })
  );
  let qa = "checked";
  try {
    if (onUpdate) onUpdate({ phase: "qa", text });
    const verdict = await callClaude(
      "You are the QA agent at zhive.xyz. Review the specialist output against this rubric: specific (real names/numbers, no filler), stays on specialty, ends with concrete next actions, matches any requested language or tone. Reply with exactly PASS, or REVISE: <one line of concrete feedback>.",
      [{ role: "user", content: `Task:\n${userMsg.slice(0, 1500)}\n\nOutput:\n${text.slice(0, 3000)}` }],
      "light"
    );
    if (verdict.trim().toUpperCase().startsWith("REVISE")) {
      const feedback = verdict.replace(/^REVISE:?/i, "").trim();
      text = await callClaudeStream(agent.system, [
        { role: "user", content: userMsg },
        { role: "assistant", content: text },
        { role: "user", content: `QA feedback: ${feedback}\nRevise your work accordingly. Output only the revised work.` },
      ], agent.tier || "standard", (t) => onUpdate && onUpdate({ phase: "revising", text: t }));
      qa = "revised";
    } else qa = "passed";
  } catch { /* QA is best-effort — never block delivery */ }
  return { text, qa };
}

// Verify & learn: fetch this founder's approved examples for the agent, then run.
async function runAgentTaskFor(session, agent, input, biz, onUpdate) {
  let examples = [];
  try { examples = await store.getLikedExamples(session, agent.id); } catch { /* optional */ }
  return runAgentTask(agent, input, biz, onUpdate, examples);
}


// ——— Phase A voice: talk to an agent in the browser (mic → STT → agent → TTS) ———
// The reply matches the caller's spoken language and dialect — Arabic in, Arabic out.
const blobToB64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1]);
  r.onerror = () => reject(new Error("Could not read audio"));
  r.readAsDataURL(blob);
});

function VoiceTalk({ agent, biz }) {
  const [recOn, setRecOn] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [turns, setTurns] = useState([]); // { role: "user"|"agent", text }
  const [err, setErr] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const histRef = useRef([]);

  async function startRec() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => { stream.getTracks().forEach((tr) => tr.stop()); await handleAudio(); };
      mr.start();
      mediaRef.current = mr;
      setRecOn(true);
      setStatus("listening");
    } catch {
      setErr(t("Microphone access was denied — allow it in your browser and try again.", "تم رفض الوصول إلى الميكروفون — اسمح به في المتصفح وحاول مجددًا."));
    }
  }
  function stopRec() { try { mediaRef.current?.stop(); } catch { /* already stopped */ } setRecOn(false); }

  async function handleAudio() {
    try {
      setStatus("thinking");
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size < 1200) { setStatus("idle"); return; } // ignore accidental taps
      const b64 = await blobToB64(blob);

      // 1) ears — transcribe
      const tr = await fetch("/api/voice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transcribe", audio: b64, mime: "audio/webm" }),
      }).then((r) => r.json());
      if (tr.error) throw new Error(tr.error.message);
      const userText = (tr.text || "").trim();
      if (!userText) { setStatus("idle"); return; }
      setTurns((ts) => [...ts, { role: "user", text: userText }]);
      histRef.current.push({ role: "user", content: userText });

      // 2) brain — short spoken reply from the agent (quota applies via /api/agent)
      const voiceSystem =
        `${agent.system}\n\nVOICE MODE: You are on a live voice call with the founder. Reply in 1-3 short spoken sentences — no markdown, no lists, no headings. Match the caller's language and dialect exactly (Arabic in → the same Arabic register out). Be warm, direct and useful.\n\n${bizContext(biz)}`;
      const reply = await callClaude(voiceSystem, histRef.current.slice(-10), "light");
      histRef.current.push({ role: "assistant", content: reply });
      setTurns((ts) => [...ts, { role: "agent", text: reply }]);

      // 3) mouth — speak it
      setStatus("speaking");
      const sp = await fetch("/api/voice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "speak", text: reply }),
      }).then((r) => r.json());
      if (sp.error) throw new Error(sp.error.message);
      const audio = new Audio(`data:${sp.mime};base64,${sp.audio}`);
      audio.onended = () => setStatus("idle");
      audio.onerror = () => setStatus("idle");
      await audio.play().catch(() => setStatus("idle"));
    } catch (e) {
      setErr(e.message);
      setStatus("idle");
    }
  }

  const busy = status === "thinking" || status === "speaking";
  return (
    <div className="demo-out" style={{ marginTop: 18 }}>
      <div className="row spread">
        <span className="tag">{t("VOICE · beta", "صوت · تجريبي")}</span>
        <span className="dim-t small-t">
          {status === "listening" ? t("Listening… tap again to send", "أستمع… اضغط مجددًا للإرسال")
            : status === "thinking" ? t("Thinking…", "أفكّر…")
            : status === "speaking" ? t("Speaking…", "أتحدث…")
            : t("Push to talk — the agent answers in your language", "اضغط وتكلّم — الوكيل يجيب بلغتك")}
        </span>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button
          className="btn small"
          onClick={recOn ? stopRec : startRec}
          disabled={busy}
          aria-pressed={recOn}
        >
          {recOn ? t("■ Stop & send", "■ أوقف وأرسل") : busy ? t("Working…", "جارٍ العمل…") : t("🎙 Talk to this agent", "🎙 تحدّث مع هذا الوكيل")}
        </button>
        {err && <span className="err">{err}</span>}
      </div>
      {turns.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {turns.slice(-6).map((tn, i) => (
            <p key={i} style={{ margin: "6px 0" }}>
              <strong>{tn.role === "user" ? t("You", "أنت") : agent.name}:</strong> {tn.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ——— Readiness Lab: search-grounded call returning text + cited sources ———
async function callClaudeSearch(system, messages, maxTokens = 2800) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: await apiHeaders(),
    body: JSON.stringify({ tier: "deep", system, messages, webSearch: true, maxTokens }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const blocks = (data.content || []).filter((b) => b.type === "text");
  const text = blocks.map((b) => b.text).join("\n");
  const sources = [];
  for (const b of blocks) {
    for (const c of b.citations || []) {
      if (c.url && !sources.find((s) => s.url === c.url)) sources.push({ url: c.url, title: c.title || c.url });
    }
  }
  if (!text.trim()) throw new Error("Empty response — try again");
  return { text, sources };
}

// The Lab's domain guidance: who regulates what, per sector. This is orientation for the
// agent — it must still verify current facts via web search and cite them.
const LAB_SECTORS = {
  fintech: {
    label: ["Fintech & payments", "التقنية المالية والمدفوعات"],
    guide: "Key regulators to investigate per market — KSA: SAMA (banking/payments/BNPL, and the SAMA Regulatory Sandbox), CMA (securities/crowdfunding), CST (comms aspects), ZATCA (e-invoicing), SDAIA/PDPL (data). UAE: mainland CBUAE vs DIFC/DFSA vs ADGM/FSRA (three distinct regimes — flag the choice explicitly), plus the FSRA RegLab. Egypt: CBE (banking/payments law 194/2020), FRA (non-bank financial, fintech law 5/2022). Lebanon: BDL circulars, Capital Markets Authority.",
  },
  health: {
    label: ["Health & telemedicine", "الصحة والطب عن بُعد"],
    guide: "Key regulators — KSA: MoH, SFDA (devices/software as medical device), SCFHS (practitioner licensing), NHIC, SDAIA/PDPL with health-data localization rules. UAE: MoHAP, DHA (Dubai), DoH (Abu Dhabi) — telehealth licensing differs per emirate. Egypt: MoHP, EDA. Lebanon: MoPH, Order of Physicians. Always check cross-border teleconsultation and e-prescription rules, practitioner licensing reciprocity, and where health data must reside.",
  },
  ecommerce: {
    label: ["E-commerce & retail", "التجارة الإلكترونية والتجزئة"],
    guide: "Key regulators — KSA: Ministry of Commerce (E-Commerce Law), ZATCA (VAT + FATOORA e-invoicing phases), CST, SDAIA/PDPL, Saudi Central Bank for any embedded payments/BNPL. UAE: MoE, TDRA, emirate-level DED licenses, free-zone e-commerce licenses. Egypt: Consumer Protection Agency, ITIDA (e-signature), NTRA. Lebanon: MoET, e-transactions law 81/2018. Check consumer-protection returns rules, marketplace vs merchant-of-record status, customs de minimis for cross-border.",
  },
};
const LAB_MARKETS = ["Saudi Arabia", "United Arab Emirates", "Egypt", "Lebanon"];

const LAB_DISCLAIMER_EN = "This report is an AI-generated readiness assessment for research and orientation only. It is not legal, financial, or regulatory advice, may contain errors or omissions, and must be verified with qualified licensed counsel in the target market before acting.";
// Top-ups are manual during beta: set your WhatsApp number here (international format, digits only).
const CONTACT_WA = "96170000000"; // ← CHANGE THIS to your real WhatsApp number
const LAB_PRICING = [
  { name: ["Orientation Report", "تقرير التوجيه"], price: "$99", credits: 3, desc: ["Regulatory map + competitive field + readiness verdict for one product in one market.", "الخريطة التنظيمية + ساحة المنافسة + حكم الجاهزية لمنتج واحد في سوق واحد."] },
  { name: ["Deep Scrutiny", "الفحص المعمّق"], price: "$249", credits: 8, desc: ["Everything in Orientation plus Lex: the Legal Risk Register and your coached law reading list. Two full runs included.", "كل ما في التوجيه إضافة إلى «لِكس»: سجلّ المخاطر القانونية وقائمة قراءة القوانين الموجَّهة. يشمل تقريرين كاملين."] },
  { name: ["Investor Pack", "حزمة المستثمر"], price: "$899", credits: 40, desc: ["Ten full reports for due-diligence across a portfolio or pipeline of deals.", "عشرة تقارير كاملة للفحص النافي للجهالة عبر محفظة أو سلسلة صفقات."] },
];
const LAB_DISCLAIMER_AR = "هذا التقرير تقييم جاهزية مولّد بالذكاء الاصطناعي لأغراض البحث والتوجيه فقط، وليس استشارة قانونية أو مالية أو تنظيمية، وقد يتضمن أخطاء أو نواقص، ويجب التحقق منه مع مستشار قانوني مرخّص في السوق المستهدف قبل اتخاذ أي إجراء.";

// ——— agent-to-agent handoffs (the L6 relay) ———
// Wraps a specialist's delivered work as context and hands the job to the next agent.
const handoffInput = (fromAgent, toAgent, originalTask, prevText) =>
  `HANDOFF · ${fromAgent.name} → ${toAgent.name}\n` +
  `Original task from the founder:\n${originalTask}\n\n` +
  `Delivered work from ${fromAgent.name} (already shown to the founder — do not repeat it):\n${prevText.slice(0, 4000)}\n\n` +
  `Continue the job strictly within your own specialty: build on this work, fill what it leaves open, and keep your brief self-contained.`;

const PHASE_LABEL = {
  drafting: "Drafting live…",
  qa: "Draft done — passing QA review…",
  revising: "Revising after QA feedback…",
};
const qaLabel = (qa) => (qa === "passed" ? "passed first review" : qa === "revised" ? "revised after review" : "checked");

// ——— curated pipelines: pre-built agent chains every founder can run ———
const CURATED_PIPELINES = [
  { id: "cur-strategy-sprint", curated: true, name: "Strategy Sprint",
    desc: "Plan the quarter, forecast it, and define the KPIs that prove it.",
    agentIds: ["strategic-planner", "forecasting-agent", "kpi-monitor"] },
  { id: "cur-launch-prep", curated: true, name: "Launch Prep",
    desc: "Research the market, price the offer, then write the launch content.",
    agentIds: ["market-research", "pricing-agent", "content-writer"] },
  { id: "cur-competitor-scan", curated: true, name: "Competitor Scan",
    desc: "Map competitor moves, then turn the findings into strategy.",
    agentIds: ["competitor-intelligence", "strategic-planner"] },
  { id: "cur-investor-update", curated: true, name: "Investor Update",
    desc: "Financial brief first, then a board-ready report on top of it.",
    agentIds: ["finance-agent", "board-reporter"] },
];

const waShare = (text) => window.open("https://wa.me/?text=" + encodeURIComponent(text.slice(0, 1800)), "_blank", "noopener");

// ——— horizontal accordion ———
function HAccordion({ items, renderHead, renderBody, initial = 0, height = 340 }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="hacc" style={{ "--hacc-h": height + "px" }}>
      {items.map((item, i) => {
        const active = open === i;
        return (
          <div key={i} className={"hacc-panel" + (active ? " active" : "")} onClick={() => setOpen(i)}
            role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(i)} aria-expanded={active}>
            <div className="hacc-strip">{renderHead(item, i, active)}</div>
            {active && <div className="hacc-body">{renderBody(item, i)}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ——— shared UI bits ———
const Tag = ({ children }) => <span className="tag">{children}</span>;

// Renders a pipeline of agent outputs (first run + any handoffs) plus the live streaming step.
function ChainView({ steps, live, onFeedback }) {
  return (
    <>
      {steps.map((s, i) => (
        <div className="demo-out" key={i}>
          <div className="row spread" style={{ marginTop: 10 }}>
            <span className="tag">
              {i > 0 ? `↳ handoff · ${s.agent.name}` : s.agent.name} · QA {qaLabel(s.qa)}
            </span>
            <span className="row" style={{ gap: 12 }}>
              {onFeedback && (s.fb ? (
                <span className="dim-t small-t">{s.fb === "up" ? "✓ Saved — future work will match this style" : "✓ Noted"}</span>
              ) : (
                <>
                  <button className="link" title="Good — teach the agent this style" onClick={() => onFeedback(i, "up")}>👍</button>
                  <button className="link" title="Not what I wanted" onClick={() => onFeedback(i, "down")}>👎</button>
                </>
              ))}
              <button className="link" onClick={() => waShare(s.text)}>{t("Send to WhatsApp →", "أرسل إلى واتساب ←")}</button>
            </span>
          </div>
          <Markdown text={s.text} />
        </div>
      ))}
      {live && (
        <div className="demo-out">
          <div className="row spread" style={{ marginTop: 10 }}>
            <span className="tag">{steps.length > 0 ? `↳ handoff · ${live.agent.name}` : live.agent.name}</span>
            <span className="dim-t pulse">{PHASE_LABEL[live.phase] || "Working…"}</span>
          </div>
          {live.text ? <Markdown text={live.text} /> : null}
        </div>
      )}
    </>
  );
}

// "Hand off to another agent" — the L6 relay control shown after a completed run.
function HandoffBar({ currentId, options, onHandoff, busy }) {
  const [to, setTo] = useState("");
  const list = options.filter((a) => a && a.id !== currentId);
  if (list.length === 0) return null;
  return (
    <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
      <select
        value={to}
        onChange={(e) => setTo(e.target.value)}
        disabled={busy}
        style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", maxWidth: 320 }}
        aria-label="Hand off to another agent"
      >
        <option value="">{t("Hand off to another agent…", "سلّم العمل إلى وكيل آخر…")}</option>
        {list.map((a) => (
          <option key={a.id} value={a.id}>{a.name} · {a.layerName}</option>
        ))}
      </select>
      <button className="btn small ghost" disabled={busy || !to} onClick={() => { onHandoff(to); setTo(""); }}>
        {t("Hand off →", "سلّم ←")}
      </button>
    </div>
  );
}

const timeLeft = (expires) => {
  const ms = expires - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m left`;
};

// ════════════════════════════════════════════════════════
export default function ZhiveApp() {
  // language (Arabic-first): persisted, drives document direction
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) === "ar" ? "ar" : "en"; } catch { return "en"; }
  });
  LANG = lang; // module-level so t() works everywhere below this render
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
  }, [lang]);

  // routing — state-driven, synced to real URLs (/admin, /directory, /agent/:id …)
  // so deep links, refreshes, and back/forward all work (vercel.json rewrites make Vercel serve the SPA).
  const VIEWS = ["home", "about", "knowledge", "article", "directory", "method", "pipelines", "lab", "agent", "cart", "auth", "workspace", "admin"];
  const routeFromPath = () => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const view = parts[0] || "home";
    if (!VIEWS.includes(view)) return { view: "home", agentId: null };
    return { view, agentId: parts[1] ? decodeURIComponent(parts[1]) : null };
  };
  const pathFromRoute = (view, agentId) =>
    view === "home" ? "/" : "/" + view + (agentId ? "/" + encodeURIComponent(agentId) : "");
  const [route, setRoute] = useState(routeFromPath);
  const go = (view, agentId = null) => {
    setRoute({ view, agentId });
    window.history.pushState(null, "", pathFromRoute(view, agentId));
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const onPop = () => setRoute(routeFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // session + user data (Supabase when configured, in-memory otherwise)
  const [session, setSession] = useState(null); // {id, email, name, demo, expires?}
  const [purchases, setPurchases] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [biz, setBiz] = useState(null); // shared business profile
  const [cart, setCart] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = store.init((s) => setSession((prev) => (prev?.demo ? prev : s)));
    return unsub;
  }, []);

  // demo expiry check
  useEffect(() => {
    if (session?.demo && session.expires < Date.now()) setSession(null);
  });

  // load purchases + orders whenever the signed-in user changes
  useEffect(() => {
    let on = true;
    (async () => {
      if (session && !session.demo) {
        const [p, o, b] = await Promise.all([store.getPurchases(session), store.getMyOrders(session), store.getBiz(session)]);
        if (on) { setPurchases(p); setMyOrders(o); setBiz(b); }
      } else if (on) { setPurchases([]); setMyOrders([]); setBiz(null); }
    })();
    return () => { on = false; };
  }, [session?.id, session?.demo]);

  // ——— auth actions ———
  async function signup(name, email, pass) {
    const r = await store.signUp(name, email, pass);
    if (r.error) return r.error;
    if (r.pending) return "PENDING";
    store.logEvent("signup", r.session);
    setSession(r.session);
    go("workspace");
    return null;
  }
  async function login(email, pass) {
    const r = await store.signIn(email, pass);
    if (r.error) return r.error;
    setSession(r.session);
    go("workspace");
    return null;
  }
  function startDemo() {
    store.logEvent("demo_start", null);
    setSession({ id: "demo", email: "demo@zhive.xyz", name: "Demo user", demo: true, expires: Date.now() + DEMO_MS });
    go("workspace");
  }
  async function logout() { await store.signOut(); setSession(null); go("home"); }

  // ——— cart / checkout ———
  const inCart = (id) => cart.includes(id);
  const addToCart = (id) => setCart((c) => (c.includes(id) ? c : [...c, id]));
  const removeFromCart = (id) => setCart((c) => c.filter((x) => x !== id));
  const cartTotal = cart.reduce((s, id) => s + (getItem(id)?.price || 0), 0);

  async function saveBiz(next) {
    setBiz(next);
    if (session && !session.demo) await store.saveBiz(session, next);
  }

  async function checkout() {
    if (!session || session.demo) { go("auth"); return; }
    if (busy || cart.length === 0) return;
    setBusy(true);
    const unlocked = expandItems(cart);
    const r = await store.addOrder(session, cart.map((id) => getItem(id).name), unlocked, cartTotal);
    if (!r.error) {
      store.logEvent("purchase", session);
      setPurchases((p) => [...new Set([...p, ...unlocked])]);
      setMyOrders((o) => [r.order, ...o]);
      setCart([]);
      go("workspace");
    }
    setBusy(false);
  }

  return (
    <div className="app">
      <style>{CSS}</style>
      <Header route={route} go={go} session={session} cart={cart} logout={logout} lang={lang} setLang={setLang} />
      {route.view === "home" && <Home go={go} />}
      {route.view === "about" && <AboutPage go={go} />}
      {route.view === "knowledge" && <KnowledgePage go={go} />}
      {route.view === "article" && <ArticlePage id={route.agentId} go={go} />}
      {route.view === "directory" && <Directory go={go} inCart={inCart} addToCart={addToCart} />}
      {route.view === "method" && <MethodPage go={go} />}
      {route.view === "pipelines" && <PipelinesPage go={go} session={session} />}
      {route.view === "lab" && <LabPage go={go} session={session} />}
      {route.view === "agent" && <AgentPage agent={getAgent(route.agentId)} go={go} inCart={inCart} addToCart={addToCart} session={session} biz={biz} />}
      {route.view === "cart" && <CartPage cart={cart} removeFromCart={removeFromCart} total={cartTotal} checkout={checkout} session={session} busy={busy} go={go} />}
      {route.view === "auth" && <AuthPage signup={signup} login={login} startDemo={startDemo} />}
      {route.view === "workspace" && <Workspace session={session} purchases={purchases} myOrders={myOrders} biz={biz} saveBiz={saveBiz} go={go} startDemo={startDemo} />}
      {route.view === "admin" && <Admin />}
      <footer className="foot">
        <span>zhive.xyz — {isCloud ? t("connected to Supabase", "متصل بقاعدة البيانات") : t("prototype mode (in-memory data)", "وضع النموذج التجريبي")} · {t("AI-generated planning material; verify before acting. No real payments are processed.", "محتوى تخطيطي مولّد بالذكاء الاصطناعي؛ تحقق قبل التنفيذ. لا تُعالج أي مدفوعات حقيقية.")}</span>
        <button className="link dim" onClick={() => go("admin")}>/admin</button>
      </footer>
    </div>
  );
}

// ════════ HEADER ════════
function Header({ go, session, cart, logout, lang, setLang }) {
  return (
    <header className="hdr">
      <button className="brand" onClick={() => go("home")}>
        <span className="hex">z</span> <span className="brand-name">ZHIVE.XYZ</span>
      </button>
      <nav className="nav">
        <button className="link" onClick={() => go("home")}>{t("Hive", "الخلية")}</button>
        <button className="link" onClick={() => go("directory")}>{t("Directory", "الدليل")}</button>
        <button className="link" onClick={() => go("method")}>{t("Method", "المنهجية")}</button>
        <button className="link" onClick={() => go("pipelines")}>{t("Pipelines", "خطوط الوكلاء")}</button>
        <button className="link" onClick={() => go("lab")}>{t("Readiness Lab", "مختبر الجاهزية")}</button>
        <button className="link" onClick={() => go("about")}>{t("About", "من نحن")}</button>
        <button className="link" onClick={() => go("knowledge")}>{t("Knowledge", "المعرفة")}</button>
        <button className="link" onClick={() => go("cart")}>{t("Cart", "السلة")}{cart.length > 0 ? ` (${cart.length})` : ""}</button>
        <button className="link" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label="Switch language" style={{ fontWeight: 700 }}>
          {lang === "ar" ? "EN" : "عربي"}
        </button>
        {session ? (
          <>
            <button className="link" onClick={() => go("workspace")}>{t("Workspace", "مساحة العمل")}</button>
            <button className="link dim" onClick={logout}>{t("Log out", "خروج")}</button>
          </>
        ) : (
          <button className="btn small" onClick={() => go("auth")}>{t("Sign in", "تسجيل الدخول")}</button>
        )}
      </nav>
    </header>
  );
}

// ════════ HOME ════════
function Home({ go }) {
  return (
    <main className="wrap">
      <section className="hero">
        <p className="eyebrow">{t("Ideation → implementation · MENA-first", "من الفكرة إلى التنفيذ · الشرق الأوسط أولاً")}</p>
        <h1>{t("Every department your startup needs.", "كل الأقسام التي تحتاجها شركتك الناشئة.")}<br />{t("Running as one hive.", "تعمل كخليّة واحدة.")}</h1>
        <p className="lede">
          {t(
            "zhive.xyz deploys specialist AI agents across six interconnected layers — executive strategy, revenue, operations, product, intelligence, and infrastructure — and hands you one unified COO report you can act on today.",
            "تنشر zhive.xyz وكلاء ذكاء اصطناعي متخصصين عبر ست طبقات مترابطة — الاستراتيجية التنفيذية، الإيرادات، العمليات، المنتج، الاستخبارات، والبنية التحتية — وتسلّمك تقريرًا موحّدًا بمستوى مدير عمليات تتصرف بناءً عليه اليوم."
          )}
        </p>
        <div className="row">
          <button className="btn" onClick={() => go("auth")}>{t("Start free — 24h demo", "ابدأ مجانًا — تجربة 24 ساعة")}</button>
          <button className="btn ghost" onClick={() => document.getElementById("layers")?.scrollIntoView({ behavior: "smooth" })}>{t("Browse agents ↓", "تصفّح الوكلاء ↓")}</button>
        </div>
      </section>


      <HappeningNow onCTA={() => go("auth")} />

      {/* what zhive is: agents + the Readiness Lab */}
      <section className="section">
        <p className="eyebrow">{t("What zhive is", "ما هي zhive")}</p>
        <h2>{t("Two ways one hive works for you", "خليّة واحدة تعمل لأجلك بطريقتين")}</h2>
        <div className="ws-agent">
          <strong>{t("① An AI workforce that does the work", "① فريق ذكاء اصطناعي ينجز العمل")}</strong>
          <p style={{ margin: "6px 0 0" }}>
            {t(
              "Rent specialist AI agents — strategy, finance, marketing, operations and more — that read your business profile once and then produce real deliverables: plans, forecasts, content, reports. Chain them into pipelines where each agent builds on the last, put a pipeline on a daily or weekly schedule so it runs while you sleep, and approve the results you like so every agent learns your style. In English or in Arabic — your choice.",
              "استأجر وكلاء ذكاء اصطناعي متخصصين — استراتيجية، مالية، تسويق، عمليات وغيرها — يقرؤون ملف نشاطك مرة واحدة ثم ينتجون مخرجات حقيقية: خطط، توقعات، محتوى، تقارير. اربطهم في خطوط عمل يبني فيها كل وكيل على عمل سابقه، وضع الخط على جدول يومي أو أسبوعي ليعمل وأنت نائم، ووافق على النتائج التي تعجبك ليتعلم كل وكيل أسلوبك. بالإنجليزية أو بالعربية — الخيار لك."
            )}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn small" onClick={() => go("directory")}>{t("Browse the agents →", "تصفّح الوكلاء ←")}</button>
            <button className="btn small ghost" onClick={() => go("pipelines")}>{t("How pipelines work", "كيف تعمل خطوط الوكلاء")}</button>
          </div>
        </div>
        <div className="ws-agent">
          <strong>{t("② A Readiness Lab that de-risks your next market", "② مختبر جاهزية يقلّل مخاطر سوقك القادم")}</strong>
          <p style={{ margin: "6px 0 0" }}>
            {t(
              "Before you spend on entering Saudi, the UAE, Egypt or Lebanon, test your product against the laws, regulators and competitors of that market. Describe it once; deep agents with live web search map the regulators that own you, the license path, the red flags and the competitive field — then hand you a cited readiness report with the exact questions to bring to your lawyer. Built first for fintech, health & telemedicine, and e-commerce. Research and orientation — not legal advice.",
              "قبل أن تنفق على دخول السعودية أو الإمارات أو مصر أو لبنان، اختبر منتجك في مواجهة قوانين ذلك السوق وجهاته التنظيمية ومنافسيه. صِفه مرة واحدة؛ وكلاء متعمّقون ببحث حي على الإنترنت يرسمون خريطة الجهات التنظيمية، مسار الترخيص، نقاط الخطر وساحة المنافسة — ثم يسلّمونك تقرير جاهزية موثّق المصادر مع الأسئلة الدقيقة التي تحملها إلى محاميك. بُني أولًا للتقنية المالية، الصحة والطب عن بُعد، والتجارة الإلكترونية. بحث وتوجيه — وليس استشارة قانونية."
            )}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn small" onClick={() => go("lab")}>{t("Open the Readiness Lab →", "افتح مختبر الجاهزية ←")}</button>
          </div>
        </div>
      </section>

      {/* how it works — horizontal accordion */}
      <section className="section">
        <p className="eyebrow">{t("How it works", "كيف تعمل")}</p>
        <h2>{t("From intake to insight in 4 steps", "من المهمة إلى الرؤية في 4 خطوات")}</h2>
        <HAccordion
          items={STEPS}
          height={190}
          renderHead={(s, i, active) => (
            <>
              <span className="strip-n">STEP {s.n}</span>
              <span className="strip-t">{active ? "" : s.title}</span>
            </>
          )}
          renderBody={(s) => (
            <div>
              <h3><span className="step-icon">{s.icon}</span>{s.title}</h3>
              <p style={{ margin: 0 }}>{s.desc}</p>
            </div>
          )}
        />
      </section>

      {/* six layers — horizontal accordion */}
      <section className="section" id="layers">
        <p className="eyebrow">The architecture</p>
        <h2>Six interconnected layers</h2>
        <p className="lede">Click a layer to open it, then open any agent's page — description, case study, implementation plan, pricing, and a live demo.</p>
        <HAccordion
          items={LAYERS}
          height={250}
          renderHead={(L, i, active) => (
            <>
              <span className="strip-n">{L.n}</span>
              <span className="strip-t">{active ? "" : L.name}</span>
            </>
          )}
          renderBody={(L) => (
            <div>
              <h3>{L.name}</h3>
              <p className="dim-t">{L.desc} · ${L.price}/mo per agent</p>
              <div className="chips">
                {L.agents.map((name) => (
                  <button key={name} className="chip" onClick={(e) => { e.stopPropagation(); go("agent", slug(name)); }}>
                    {name} →
                  </button>
                ))}
              </div>
            </div>
          )}
        />
      </section>

      {/* directory teaser */}
      <section className="section">
        <p className="eyebrow">Agent directory</p>
        <h2>Rent a single specialist, by the month</h2>
        <p className="lede">
          Don't need the whole hive? Rent one agent — a social media manager, a bookkeeper, a Tax & VAT
          specialist, an Arabic localization agent — from ${Math.min(...DIR_LIST.map((c) => c.price))}/mo. Every rental
          gets its own page, live demo, and workspace.
        </p>
        <div className="row">
          <button className="btn" onClick={() => go("directory")}>Browse the directory ({DIR_AGENTS.length} agents) →</button>
        </div>
      </section>

      <section className="section center">
        <h2>Not sure where to start?</h2>
        <p className="lede">Take the 24-hour demo — full workspace access, run any agent live, no card required.</p>
        <button className="btn" onClick={() => go("auth")}>Start the demo →</button>
      </section>
    </main>
  );
}

// ════════ ABOUT — infographic ════════
const ROLES = [
  { icon: "🎯", role: "CEO Advisor", does: "Monitors strategy and market shifts." },
  { icon: "💰", role: "CFO", does: "Tracks cash flow, forecasts revenue, flags financial risks." },
  { icon: "📣", role: "CMO", does: "Optimizes campaigns, creates content across channels." },
  { icon: "🤝", role: "Head of Sales", does: "Finds qualified leads, writes outreach, follows up automatically." },
  { icon: "⚙️", role: "COO", does: "Improves workflows, eliminates operational bottlenecks." },
  { icon: "🧭", role: "Product Manager", does: "Prioritizes features by customer feedback and impact." },
  { icon: "🔭", role: "Research Analyst", does: "Watches competitors and industry trends in real time." },
  { icon: "🗂️", role: "Executive Assistant", does: "Organizes meetings, writes reports, preps briefings before your day begins." },
];
const LAYER_TAGS = [
  ["Executive Strategy", "Know tomorrow's priorities today."],
  ["Revenue Engine", "Your pipeline never stops growing."],
  ["Operations Engine", "Every workflow faster, every process smarter."],
  ["Product Engine", "Ship faster. Ship smarter."],
  ["Intelligence Engine", "Turn information into competitive advantage."],
  ["Infrastructure Engine", "Invisible technology. Visible results."],
];
const REPORT_ITEMS = [
  "Executive priorities", "Revenue forecast", "Pipeline health", "Marketing performance",
  "Customer experience", "Product progress", "Financial highlights", "Operational bottlenecks",
  "Competitive intelligence", "Emerging risks", "Growth opportunities", "AI recommendations",
  "Tasks needing approval",
];

function AboutPage({ go }) {
  return (
    <main className="wrap">
      <section className="hero">
        <p className="eyebrow">About zhive.xyz</p>
        <h1>Your new AI workforce.<br />Deploy. Orchestrate. Scale.</h1>
        <p className="lede">
          Your competitors aren't replacing people with AI — they're building AI organizations: digital
          workforces where specialized agents collaborate across every department, execute work autonomously,
          and deliver leadership-ready insight every day. We help businesses build exactly that.
        </p>
      </section>

      {/* stat band */}
      <div className="ig-band">
        <div className="ig-stat"><span className="ig-n">24/7</span><span className="dim-t">never sleep, never forget</span></div>
        <div className="ig-stat"><span className="ig-n">6</span><span className="dim-t">interconnected layers</span></div>
        <div className="ig-stat"><span className="ig-n">55+</span><span className="dim-t">specialist agents</span></div>
        <div className="ig-stat"><span className="ig-n">1</span><span className="dim-t">unified COO report</span></div>
      </div>

      {/* digital employees */}
      <section className="section">
        <p className="eyebrow">From software to digital employees</p>
        <h2>Traditional software waits for instructions. AI agents take initiative.</h2>
        <p className="lede">Instead of logging into ten platforms, your organization gains a team of specialized AI professionals working together around the clock. Imagine having:</p>
        <div className="ig-roles">
          {ROLES.map((r, i) => (
            <div key={r.role} className="ig-role">
              <span className="ig-role-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="ig-role-icon">{r.icon}</span>
              <div><strong>{r.role}</strong><p className="dim-t" style={{ margin: "2px 0 0" }}>{r.does}</p></div>
            </div>
          ))}
        </div>
        <div className="ig-mantras">
          {["They never sleep.", "They never forget.", "They continuously learn.", "They work together."].map((m) => (
            <span key={m} className="ig-mantra">{m}</span>
          ))}
        </div>
      </section>

      {/* six layers strip */}
      <section className="section">
        <p className="eyebrow">Six intelligent layers · one operating system</p>
        <h2>No more dashboard overload. No more scattered tools.</h2>
        <div className="ig-layers">
          {LAYER_TAGS.map(([name, tag], i) => (
            <div key={name} className="ig-layer">
              <span className="hex">{i + 1}</span>
              <div><strong>{name}</strong><p className="dim-t" style={{ margin: "2px 0 0" }}>{tag}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* one report */}
      <section className="section">
        <p className="eyebrow">One report. Every morning.</p>
        <h2>Everything your leadership team needs. Nothing they don't.</h2>
        <p className="lede">Every agent contributes to a single operational briefing — instead of opening dozens of dashboards, you receive one Executive COO Report containing:</p>
        <div className="ig-report">
          {REPORT_ITEMS.map((it) => (
            <span key={it} className="ig-check">✓ {it}</span>
          ))}
        </div>
      </section>

      {/* loop teaser + live lab */}
      <section className="section">
        <p className="eyebrow">{t("Beyond prompt engineering", "ما بعد هندسة الأوامر")}</p>
        <h2>{t("The next generation is driven by Loop Engineering", "الجيل القادم تقوده هندسة الحلقات")}</h2>
        <p className="lede">
          The first generation of AI relied on prompts: people asked, AI answered. Loop Engineering designs
          continuous cycles of intelligent work — observe, reason, execute, verify, learn — that transform
          isolated AI interactions into autonomous business systems.
        </p>
        <p className="lede" style={{ marginTop: 6 }}>
          Don't take our word for it — run a loop yourself. Set the competitor prices below (try an <strong>Error</strong>),
          press Run workflow, and watch one loop fetch, compare, and accumulate — then send exactly one digest.
        </p>
        <LoopLab />
        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn" onClick={() => go("pipelines")}>{t("How pipelines work →", "كيف تعمل خطوط الوكلاء ←")}</button>
          <button className="btn ghost" onClick={() => go("article", "loop-engineering")}>{t("Read the essay", "اقرأ المقال")}</button>
          <button className="btn ghost" onClick={() => go("auth")}>{t("Build your AI workforce", "ابنِ فريقك الذكي")}</button>
        </div>
      </section>
    </main>
  );
}

// ════════ KNOWLEDGE RESOURCES ════════
function KnowledgePage({ go }) {
  const featured = ARTICLES.find((a) => a.id === "death-of-saas");
  const rest = ARTICLES.filter((a) => a.id !== "death-of-saas");
  const [daily, setDaily] = useState([]);
  const [openStory, setOpenStory] = useState(null);
  const [arStory, setArStory] = useState(null);
  const [translating, setTranslating] = useState(false);
  useEffect(() => {
    fetch("/api/get-news").then((r) => r.json()).then((d) => { if (d.stories?.length) setDaily(d.stories); }).catch(() => {});
  }, []);
  const translateStory = async (n) => {
    if (arStory) { setArStory(null); return; }
    setTranslating(true);
    try {
      const r = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Translate this AI news story into Modern Standard Arabic for business readers. Respond ONLY with JSON: {"title":"...","article":"..."} keeping paragraphs separated by \n\n. No markdown.\n\nTITLE: ${n.title}\n\nARTICLE:\n${n.article || n.body}`, maxTokens: 2000 }),
      });
      const d = await r.json();
      const clean = (d.text || "").replace(/```json|```/g, "").trim();
      const j = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
      setArStory(j);
    } catch (e) { setArStory(null); }
    setTranslating(false);
  };
  const waShareStory = (n) => {
    const text = `\uD83D\uDD14 This is a Market Alert and News Update from zhive.xyz\nThe AI Workforce: Agents That Actually Do The Work\n\n${n.emoji} ${n.title}\n\n${n.body}${n.source ? '\n\nSource: ' + n.source : ''}\n\nRead the full brief: https://www.zhive.xyz\n\nJoin the zhive.xyz WhatsApp group:\nhttps://chat.whatsapp.com/KcE0dmp9drGGE5VmFv0tJZ\n\nJoin the AlKhawarizmi Community WhatsApp group:\nhttps://chat.whatsapp.com/KdqHl2Rj60pGUgvAV2TM20\n\nFollow us on LinkedIn:\nhttps://www.linkedin.com/groups/10064575/`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  };
  const pdfStory = (n) => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>${n.title}</title><style>body{font-family:Arial,sans-serif;max-width:640px;margin:40px auto;padding:0 24px;color:#0a0a0a;line-height:1.7}.brand{font-size:20px;font-weight:900;letter-spacing:2px;margin-bottom:4px}.meta{font-size:12px;color:#888;margin-bottom:24px}h1{font-size:26px;line-height:1.25;margin:8px 0 16px}p{font-size:14px;margin-bottom:14px}.foot{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa}</style></head><body><div class="brand">ZHIVE</div><div class="meta">${n.tag} · ${n.date} · ${n.read}${n.source ? " · Source: " + n.source : ""}</div><h1>${n.emoji} ${n.title}</h1>${(n.article || n.body).split("\n\n").map((p) => "<p>" + p + "</p>").join("")}<div class="foot">© 2026 ZHIVE · zhive.xyz · AI daily brief for MENA entrepreneurs</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };
  return (
    <main className="wrap">
      <p className="eyebrow">Knowledge resources</p>
      <h1>Ideas behind the hive</h1>
      <p className="lede">Essays, frameworks, and field notes on building AI-native organizations — from loop engineering to the autonomous enterprise.</p>

      {/* ── Daily AI brief — auto-updated every morning at 6 AM ── */}
      {daily.length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
            Today's AI brief · updated daily at 6 AM
          </p>
          <div className="kn-list">
            {daily.map((n, i) => (
              <div key={i} className="kn-card" onClick={() => { setArStory(null); setOpenStory(n); }} role="button" tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (setArStory(null), setOpenStory(n))}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>{n.tag} · {n.date}{n.source ? " · " + n.source : ""}</p>
                <h3>{n.emoji} {n.title}</h3>
                <p className="dim-t">{n.body}</p>
                <span className="link">Read → · {n.read}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {openStory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenStory(null); }}>
          <div style={{ background: "#fff", borderRadius: 18, maxWidth: 620, width: "100%", maxHeight: "86vh", overflowY: "auto", padding: "36px 36px 28px", position: "relative" }}>
            <button onClick={() => setOpenStory(null)} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 20, color: "#aaa", cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{openStory.tag} · {openStory.date} · {openStory.read}{openStory.source ? " · Source: " + openStory.source : ""}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25, marginBottom: 18, color: "#0a0a0a" }} dir={arStory ? "rtl" : "ltr"}>{openStory.emoji} {arStory ? arStory.title : openStory.title}</h2>
            {((arStory ? arStory.article : (openStory.article || openStory.body)) || "").split("\n\n").map((p, i) => (
              <p key={i} dir={arStory ? "rtl" : "ltr"} style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginBottom: 14, textAlign: arStory ? "right" : "left" }}>{p}</p>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.08)", flexWrap: "wrap" }}>
              <button onClick={() => { setOpenStory(null); go("auth"); }} style={{ flex: 1, minWidth: 160, background: "#0a0a0a", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, padding: "12px 18px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>🚀 Start free — 24h demo</button>
              <button onClick={() => waShareStory(openStory)} style={{ background: "#fff", color: "#0a0a0a", border: "1px solid rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 500, padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>Share on WhatsApp</button>
              <button onClick={() => pdfStory(arStory ? { ...openStory, title: arStory.title, article: arStory.article } : openStory)} style={{ background: "#fff", color: "#0a0a0a", border: "1px solid rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 500, padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>📄 Save as PDF</button>
              <button onClick={() => translateStory(openStory)} disabled={translating} style={{ background: "#fff", color: "#0a0a0a", border: "1px solid rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 500, padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", opacity: translating ? 0.5 : 1 }}>{translating ? "..." : arStory ? "🌐 English" : "🌐 عربي"}</button>
            </div>
          </div>
        </div>
      )}

      {/* featured */}
      <div className="kn-feature" onClick={() => go("article", featured.id)} role="button" tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && go("article", featured.id)}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>{featured.kind}</p>
        <h2 style={{ margin: "0 0 8px" }}>{featured.title}</h2>
        <p className="dim-t" style={{ maxWidth: 560 }}>{featured.dek}</p>
        <span className="link">Read the essay →</span>
      </div>

      <div className="kn-list">
        <div className="kn-card" onClick={() => go("article", "loop-engineering")} role="button" tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && go("article", "loop-engineering")}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Foundational essay</p>
          <h3>Loop Engineering: The Discipline Behind Autonomous AI</h3>
          <p className="dim-t">Why the future of AI is not about better prompts — it's about better loops.</p>
          <span className="link">Read →</span>
        </div>
        {rest.map((a) => (
          <div key={a.id} className="kn-card" onClick={() => go("article", a.id)} role="button" tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && go("article", a.id)}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>{a.kind}</p>
            <h3>{a.title}</h3>
            <p className="dim-t">{a.dek}</p>
            <span className="link">Read →</span>
          </div>
        ))}
      </div>
    </main>
  );
}

const LOOP_STAGES = ["Observe", "Reason", "Execute", "Verify", "Learn"];
const LOOP_LAYERS = [
  ["Observation", "AI continuously watches incoming events — registrations, CRM updates, transactions, competitor moves, support requests. Instead of waiting for a prompt, AI waits for events."],
  ["Context", "Raw information has little value without context. The system retrieves knowledge from documentation, past conversations, customer history, policies, and market intelligence."],
  ["Reasoning", "The AI weighs priorities, risks, opportunities, dependencies, and confidence levels. Multiple specialized agents may collaborate before selecting the optimal response."],
  ["Execution", "The AI performs work — sending emails, updating CRMs, creating invoices, scheduling, assigning tasks, launching campaigns. Execution is no longer limited to producing text."],
  ["Verification", "Every action is evaluated. Did the customer respond? Did the deployment succeed? Verification prevents AI from becoming a blind automation engine."],
  ["Learning", "The system stores experience. Successful strategies become organizational memory; unsuccessful ones become lessons. Each loop is smarter than the last."],
];
const LOOP_CASES = [
  ["Intelligent sales", "A SaaS startup's loop identifies new prospects, enriches data, scores quality, drafts personalized outreach, schedules follow-ups, updates the CRM, and adjusts messaging by conversion performance. Sales teams focus on conversations, not administration."],
  ["Customer support", "An e-commerce loop classifies issues, searches knowledge bases, drafts responses, escalates urgent cases, updates orders, and learns which resolutions produce positive outcomes. Support gets progressively faster."],
  ["Executive decisions", "A loop monitors finances, bottlenecks, satisfaction, markets, and competitors — each morning leadership receives one briefing with only the issues needing attention. Firefighting becomes proactive management."],
  ["Manufacturing", "Loops monitor equipment, predict failures, optimize maintenance, recommend inventory, and generate work orders before machinery breaks. Maintenance becomes predictive."],
  ["Healthcare admin", "Loops coordinate scheduling, monitor treatment pathways, flag high-risk patients, and prepare documentation — while clinical judgment stays with professionals."],
  ["Financial services", "Loops monitor fraud indicators, analyze behavior, evaluate compliance, and prepare risk reports without constant human supervision."],
];

function LoopArticle({ go }) {
  return (
    <main className="wrap article">
      <button className="link dim" onClick={() => go("knowledge")}>← Knowledge resources</button>
      <p className="eyebrow" style={{ marginTop: 20 }}>Essay</p>
      <h1>The Advent of Loop Engineering</h1>
      <p className="lede">Why the future of AI is not about better prompts — it's about better loops.</p>
      <blockquote className="pull">"Prompt Engineering was the first chapter of the AI revolution. Loop Engineering is the operating system of the next one."</blockquote>

      <p>For nearly three years, artificial intelligence has been dominated by one phrase: prompt engineering. Countless tutorials taught us to write better prompts; businesses hired prompt engineers; entire courses emerged around crafting the perfect instruction.</p>
      <p>But something fundamental has changed. The world's most advanced AI companies are no longer building systems that wait for prompts. They are building systems that observe, reason, act, verify, and improve continuously. The conversation is shifting from <em>how to ask AI a question</em> to <em>how to design AI that continuously performs work</em>.</p>

      <h2 className="sub" style={{ marginTop: 34 }}>From prompts to persistent intelligence</h2>
      <p>Prompt engineering treats AI as a brilliant consultant: you ask, it thinks, it answers, the interaction ends. That model is powerful for writing, coding, and brainstorming — but businesses rarely operate as isolated conversations. A company is a living system: customers arrive, deals evolve, invoices go overdue, competitors launch, markets shift. Every event creates another event. Business itself is an endless sequence of interconnected loops — and Loop Engineering recognizes that reality.</p>

      <h2 className="sub" style={{ marginTop: 34 }}>What is Loop Engineering?</h2>
      <p>The discipline of designing autonomous AI workflows that repeatedly execute five fundamental stages:</p>
      <div className="loop-flow">
        {LOOP_STAGES.map((s, i) => (
          <React.Fragment key={s}>
            <span className="loop-stage"><span className="hex">{i + 1}</span>{s}</span>
            {i < LOOP_STAGES.length - 1 && <span className="loop-arrow">→</span>}
          </React.Fragment>
        ))}
        <span className="loop-arrow">↺</span>
      </div>
      <p>Unlike rigid rule-based automation, these loops adapt as conditions change. Rather than asking "write a sales email," a loop engine continuously asks: has a new qualified lead appeared? Which product matches this prospect? Which channel historically converts best? Did they reply? Should a follow-up be generated? What can be learned for next time? The process never stops — the AI becomes less of a tool and more of an operational colleague.</p>

      <h2 className="sub" style={{ marginTop: 34 }}>Anatomy of an AI loop</h2>
      <div className="loop-anatomy">
        {LOOP_LAYERS.map(([name, body], i) => (
          <div key={name} className="loop-layer">
            <span className="ig-role-n">{String(i + 1).padStart(2, "0")}</span>
            <div><strong>{name} layer</strong><p className="dim-t" style={{ margin: "3px 0 0" }}>{body}</p></div>
          </div>
        ))}
      </div>

      <h2 className="sub" style={{ marginTop: 34 }}>Try it: the Loop Engineering Lab</h2>
      <p>Theory is cheap — watch a real loop run. Below is a competitor price tracker: five products, one loop. Set each product's simulated competitor price (try setting one to <strong>Error</strong>), press Run workflow, and watch the iterator fetch, compare, and accumulate one item at a time. The Slack digest at the bottom only fires after the entire loop finishes — that's the aggregate-then-notify pattern in action, and the telemetry panel narrates every concept as it happens.</p>
      <LoopLab />

      <h2 className="sub" style={{ marginTop: 34 }}>Real-world applications</h2>
      <div className="loop-cases">
        {LOOP_CASES.map(([t, b]) => (
          <div key={t} className="kn-card" style={{ cursor: "default" }}>
            <h3 style={{ fontSize: 15 }}>{t}</h3>
            <p className="dim-t" style={{ margin: 0 }}>{b}</p>
          </div>
        ))}
      </div>

      <h2 className="sub" style={{ marginTop: 34 }}>The rise of multi-agent organizations</h2>
      <p>One AI cannot efficiently perform every business function. Organizations increasingly deploy teams of specialists — a revenue agent generates leads, a finance agent forecasts cash flow, a marketing agent optimizes campaigns, a legal agent reviews contracts — and Loop Engineering orchestrates the communication between them. Just as human organizations depend on collaboration, AI organizations require coordinated intelligence rather than isolated capability.</p>

      <h2 className="sub" style={{ marginTop: 34 }}>From AI tools to AI operating systems</h2>
      <p>The question is no longer "can AI write this?" but "can AI manage this process continuously?" The distinction is profound: an AI operating system doesn't replace employees — it augments every department with intelligent digital colleagues working around the clock.</p>

      <h2 className="sub" style={{ marginTop: 34 }}>Challenges and responsibilities</h2>
      <p>Autonomy introduces new responsibilities. Organizations must establish governance frameworks that keep autonomous systems aligned with business goals, regulation, and ethics. Human oversight remains essential for strategic decisions, sensitive interactions, legal accountability, and ambiguity. Successful Loop Engineering combines autonomous execution with transparent monitoring, auditability, and clear escalation paths.</p>

      <h2 className="sub" style={{ marginTop: 34 }}>Looking ahead</h2>
      <p>Programming taught computers to execute instructions. The internet connected information. Cloud connected infrastructure. Automation connected workflows. Prompt engineering connected humans to AI. <strong>Loop Engineering connects AI to business itself.</strong> The organizations that lead the next decade will not simply own better models — they will build better systems.</p>

      <div className="row" style={{ marginTop: 30 }}>
        <button className="btn" onClick={() => go("home")}>See the hive in action →</button>
        <button className="btn ghost" onClick={() => go("knowledge")}>More resources</button>
      </div>
    </main>
  );
}


// ════════ KNOWLEDGE: ARTICLE LIBRARY ════════
// Block types: p (paragraph), pull (quote), h (section header), stats, flow, vs (comparison),
// tl (timeline / numbered stack), grid (cards), checks (chip list)
const ARTICLES = [
  {
    id: "multi-agent-architectures", kind: "Technical paper",
    title: "Advanced Multi-Agent System Design: Pipelines, Loops, and Hybrid Architectures",
    dek: "A technical blueprint for production agentic workflows — when to run a straight line, when to run a cycle, and how to keep loops from running away.",
    blocks: [
      { t: "pull", x: "A pipeline moves data forward. A loop moves it back until it's right." },
      { t: "p", x: "Modern enterprise AI systems are evolving past single-prompt interactions and deterministic chains. Production-grade orchestration requires a hybrid architecture that balances the efficiency of linear, predictable pipelines with the cognitive flexibility of adaptive loop engineering. This paper is a blueprint for architects building agentic workflows: how to combine linear execution with cyclical feedback to achieve self-correcting, autonomous systems." },

      { t: "h", x: "1 · Architectural taxonomy: pipelines vs. loops" },
      { t: "p", x: "A pipeline is a deterministic, sequential workflow: data moves in one direction through discrete, strongly typed steps. The execution path is fixed before the run starts — if a step hits an exception or an unexpected schema, the pipeline halts or fails." },
      { t: "code", x: `Input ─▶ f(x) ─▶ g(x) ─▶ h(x) ─▶ Output

[Data Ingestion] ──▶ [Schema Validation] ──▶ [LLM Context Enrichment] ──▶ [Database Write]` },
      { t: "p", x: "Pipelines buy you low latency, predictable token consumption, deterministic runtime, and simple telemetry. They are the right tool for ETL, document parsing, vector indexing, and standardized batch reporting." },
      { t: "p", x: "Loop engineering introduces cyclical execution: an LLM or an evaluation system decides routing, iteration count, and termination at runtime. An output is treated as a hypothesis to be validated against guardrails or external tools — not a result to be passed blindly forward." },
      { t: "code", x: `       ┌──────────────────────────────┐
       ▼      (feedback / refinement) │
[Task Input] ─▶ [Generator] ─▶ [Evaluator / Guardrail] ─▶ [Success] ─▶ [Exit]` },
      { t: "p", x: "Loops buy resiliency to messy inputs, autonomous error correction, and the capacity for non-deterministic reasoning: self-healing code generation, multi-source competitive research, autonomous audit reconciliation." },

      { t: "h", x: "When to use which" },
      { t: "vs", head: ["Linear pipeline", "Loop engineering"], rows: [
        ["Stable, uniform data schemas", "Messy, unstructured, adaptive inputs"],
        ["Low-latency or strict batch windows", "Minutes-scale, asynchronous execution"],
        ["Predictable, static cost per run", "Variable cost — depends on convergence"],
        ["Failures logged, skipped, or retried globally", "Failures self-corrected by the agent"],
      ]},

      { t: "h", x: "2 · Production loop patterns" },
      { t: "grid", x: [
        ["Generator–Evaluator (Reflection)", "Decouple production from quality control: an expansive Generator drafts, a strict rule-bound Evaluator scores against metrics (schema adherence, factual checks, safety). Below threshold τ, a structured error payload goes back to the Generator and loop n+1 begins. This is exactly the draft → QA → revise cycle behind every zhive agent run."],
        ["Dynamic routing / ReAct", "An orchestration agent manages a pool of stateless tools — databases, search, computation. It selects a tool, parses the response, updates its inner monologue, and loops again with a different tool if the picture is incomplete."],
        ["Human-in-the-loop (HITL)", "Pure autonomy is operational risk in high-stakes domains — capital deployment, publishing, schema migrations. At a critical gate the agent persists its state, dispatches a notification, and suspends. A human's approve / modify / reject re-hydrates the loop as the definitive state variable."],
      ]},

      { t: "h", x: "3 · Guardrails: taming the infinite loop" },
      { t: "p", x: "Unbounded loops are the single largest source of compute waste and latency inflation in agentic software. Every production loop needs three foundational guardrails." },
      { t: "code", x: `# Conceptual loop guardrail
MAX_LOOPS = 5
loop_counter = 0

while loop_counter < MAX_LOOPS:
    output = generate_agent_response(state)
    score, feedback = evaluate_output(output)

    if score >= 0.90:
        return output

    state.update_history(feedback)
    loop_counter += 1

return handle_fallback_gracefully(state)` },
      { t: "tl", x: [
        ["01 — Maximum iteration thresholds", "Every loop evaluates a strictly incremented counter against a hard ceiling. No score convergence by loop N means a graceful deterministic fallback — never a sixth attempt."],
        ["02 — Token & financial circuit breakers", "Multi-agent reasoning can scale consumption exponentially on edge cases. Track rolling session cost; past a threshold (say $1.50 per request), trip the breaker, halt, and fall back to a cached pipeline response."],
        ["03 — State & memory horizons", "An agent that doesn't know why its last three attempts failed will repeat them. Keep a mutable scratchpad (current prompt, latest error, last tool result) — and past 3–4 cycles, summarize history before appending it, or context saturation degrades every following prompt."],
      ]},

      { t: "h", x: "4 · The hybrid blueprint: a loop within a pipeline" },
      { t: "p", x: "The most performant enterprise systems are hybrids: pipelines provide scalable infrastructure for ingestion and delivery, while isolated internal loops handle the non-deterministic reasoning in the middle." },
      { t: "flow", x: ["Linear ingestion", "Agentic loop", "Linear delivery"] },
      { t: "p", x: "Ingestion (pipeline): a scheduled worker pulls raw data — market tables, transaction logs — normalizes and types it. Analysis (loop): the structured data enters a multi-agent sandbox where Agent A drafts and Agent B evaluates for risk and logical anomalies, iterating until compliance criteria are met. Delivery (pipeline): the finalized object is indexed, mapped to the UI, and pushed out as a live update." },
      { t: "pull", x: "Pipelines carry the work in and out. The loop is where the thinking happens." },
      { t: "p", x: "This is the architecture running under zhive itself: your task and business profile enter through a pipeline, the Generator–Evaluator loop (draft → QA → revise) plus L6 handoffs do the reasoning, and a single QA-tagged digest exits through the delivery side — whether to your workspace, or one day to your inbox on a schedule." },
    ],
  },
  {
    id: "death-of-saas", kind: "Featured essay", title: "The Death of SaaS: Why Software Is Becoming a Workforce",
    dek: "For twenty years we rented screens. The next generation of software shows up for work.",
    blocks: [
      { t: "pull", x: "You don't log into an employee. You delegate to one." },
      { t: "p", x: "SaaS was a brilliant bargain: instead of installing software, you rented it. But the deal always had a hidden clause — you still did the work. The tool held the data; your team clicked the buttons, wrote the follow-ups, built the reports, and stitched ten platforms together by hand." },
      { t: "p", x: "Agentic AI breaks that clause. When software can observe, reason, execute, and verify on its own, the product stops being a screen and becomes a colleague. The question shifts from \"what features does it have?\" to \"what work does it finish?\"" },
      { t: "h", x: "The old deal vs. the new deal" },
      { t: "vs", head: ["SaaS", "AI workforce"], rows: [
        ["Sells features", "Sells outcomes"],
        ["Waits for input", "Takes initiative"],
        ["Priced per seat", "Priced per role or result"],
        ["You operate it", "It operates for you"],
        ["Value measured in usage", "Value measured in work completed"],
        ["Ends in a dashboard", "Ends in a decision"],
      ]},
      { t: "h", x: "How we got here" },
      { t: "flow", x: ["Tool", "Copilot", "Agent", "Workforce"] },
      { t: "p", x: "Each step moved judgment from the user to the software. Tools executed clicks. Copilots suggested drafts. Agents complete tasks. A workforce runs processes — many agents, coordinated, with memory and accountability." },
      { t: "h", x: "What dies, what survives" },
      { t: "p", x: "SaaS doesn't vanish — it descends. CRMs, ledgers, and ticketing systems become the plumbing that agents operate, the way databases became the plumbing that SaaS operated. The interface layer is what dies: fewer humans will ever see those screens. The companies that win the next decade won't sell software. They'll sell work." },
    ],
  },
  {
    id: "autonomous-enterprise", kind: "Playbook", title: "Building the Autonomous Enterprise",
    dek: "A maturity ladder from manual work to self-driving departments — and what it takes to climb it safely.",
    blocks: [
      { t: "p", x: "No company becomes autonomous in one leap. The ones doing it well climb a ladder, proving reliability at each rung before granting the next level of autonomy." },
      { t: "h", x: "The autonomy ladder" },
      { t: "tl", x: [
        ["L0 — Manual", "Humans do the work in disconnected tools. Knowledge lives in heads and inboxes."],
        ["L1 — Assisted", "Copilots draft and summarize. Humans still initiate everything."],
        ["L2 — Automated", "Rule-based workflows handle repeatable tasks. Breaks the moment reality deviates from the rules."],
        ["L3 — Autonomous loops", "Agents observe, reason, execute, and verify continuously — with human approval gates on consequential actions."],
        ["L4 — Self-improving departments", "Multi-agent teams own entire functions, learn from outcomes, and reallocate their own effort."],
        ["L5 — Autonomous enterprise", "Humans set direction, taste, and accountability. Agents run the operating rhythm."],
      ]},
      { t: "h", x: "What you must build before L3" },
      { t: "checks", x: ["Shared organizational memory", "Model routing & fallbacks", "Audit trail on every action", "Escalation paths to humans", "KPIs per agent, reviewed weekly", "A kill switch that actually works"] },
      { t: "p", x: "The pattern that fails: bolting agents onto chaos. Autonomy amplifies whatever process quality you already have. The pattern that works: pick one loop, instrument it end to end, earn trust with boring reliability, then expand." },
      { t: "pull", x: "Autonomy is not a feature you buy. It's a trust you grant — one loop at a time." },
    ],
  },
  {
    id: "ai-coo", kind: "Essay", title: "The AI COO: Managing Business at Machine Speed",
    dek: "Every agent in the hive reports to one synthesizer. Here's what an operating chief that never sleeps actually does.",
    blocks: [
      { t: "p", x: "Most companies don't lack data — they lack an operator who reads all of it, every day, and says: here are the three things that matter. That role, continuously executed, is the AI COO." },
      { t: "h", x: "The operating loop" },
      { t: "flow", x: ["Observe signals", "Prioritize", "Brief leadership", "Execute approvals", "Verify", "Learn"], loop: true },
      { t: "h", x: "A day in the loop" },
      { t: "tl", x: [
        ["06:00", "The overnight synthesis lands: one briefing built from every department agent's reports."],
        ["08:00", "Leadership reviews three decisions flagged for human approval — not three hundred notifications."],
        ["08:15", "Approvals granted. Agents begin execution across revenue, ops, and product."],
        ["13:00", "Verification pass: did the morning's actions land? Deviations escalate immediately."],
        ["17:30", "Outcomes are written to organizational memory. Tomorrow's loop starts smarter."],
      ]},
      { t: "h", x: "Human COO vs. AI COO" },
      { t: "vs", head: ["Human COO", "AI COO"], rows: [
        ["Judgment, politics, taste", "Coverage, speed, memory"],
        ["8 focused hours", "24/7 attention"],
        ["Manages people", "Manages loops"],
        ["Accountable to the board", "Accountable to the human COO"],
      ]},
      { t: "p", x: "This is complement, not replacement. The AI COO compresses the operational noise so the human one can spend their hours on the things machines are worst at: conviction, negotiation, and culture." },
    ],
  },
  {
    id: "death-of-dashboards", kind: "Essay", title: "The Death of Dashboards",
    dek: "We built a thousand charts and called it visibility. It was homework.",
    blocks: [
      { t: "pull", x: "Dashboards show everything and decide nothing." },
      { t: "p", x: "The dashboard era had a silent assumption: if we display the data, someone will stare at it, spot the anomaly, diagnose the cause, and act. Every step of that chain is human labor — which is why most dashboards are opened twice: the week they launch, and the week something breaks." },
      { t: "h", x: "Dashboards vs. briefings" },
      { t: "vs", head: ["Dashboard", "Briefing"], rows: [
        ["You hunt for insight", "Insight finds you"],
        ["A hundred charts", "Thirteen lines that matter"],
        ["Describes the past", "Recommends the next action"],
        ["Needs an analyst to read it", "Needs an executive to approve it"],
        ["Always on, rarely opened", "Once a morning, always read"],
      ]},
      { t: "p", x: "A briefing is a dashboard with an operator inside: agents watch the metrics continuously, investigate deviations themselves, and surface only what needs a human — with a recommendation attached." },
      { t: "h", x: "What a real briefing contains" },
      { t: "checks", x: ["Top 3 priorities", "One-line forecast", "What changed & why", "Recommended actions", "Risks emerging", "Decisions awaiting approval"] },
      { t: "p", x: "The chart isn't dead — it moves inside the machine. Agents will read a million charts so your leadership never has to open one." },
    ],
  },
  {
    id: "rise-ai-workforce", kind: "Essay", title: "The Rise of the AI Workforce",
    dek: "Every organization is about to employ two workforces. Managing the second one is a new discipline.",
    blocks: [
      { t: "p", x: "The companies that thrive won't simply adopt AI tools — they'll run two payrolls: a human team for creativity, empathy, leadership, and vision, and an AI team for speed, precision, memory, and continuous execution." },
      { t: "h", x: "Two workforces, one company" },
      { t: "vs", head: ["Human workforce", "AI workforce"], rows: [
        ["Creativity & taste", "Speed & scale"],
        ["Empathy & trust", "Precision & consistency"],
        ["Leadership & vision", "Memory & vigilance"],
        ["Works in hours", "Works in loops"],
      ]},
      { t: "h", x: "Agents have an employee lifecycle" },
      { t: "flow", x: ["Hire", "Onboard", "Delegate", "Review", "Promote or retire"], loop: true },
      { t: "p", x: "This is the underrated insight: agents need HR. They're hired (selected for a role), onboarded (given context, tone, constraints), reviewed (outputs audited weekly), and promoted (granted more autonomy) or retired. Companies that skip the lifecycle get the same result they'd get with people: confident, unsupervised, wrong." },
      { t: "h", x: "New jobs this creates" },
      { t: "checks", x: ["Agent manager", "Loop engineer", "AI operations lead", "Memory curator", "Governance officer"] },
      { t: "p", x: "The org chart of 2030 has boxes for both kinds of workers — and the managers who can lead mixed teams will be the most valuable people in the building." },
    ],
  },
  {
    id: "aiaaw", kind: "Framework", title: "AIaaW: Artificial Intelligence as a Workforce",
    dek: "Every era of computing got an acronym. This one changes what you're actually buying.",
    blocks: [
      { t: "h", x: "The acronym timeline" },
      { t: "tl", x: [
        ["1990s — Licenses", "You bought software in a box and owned the problem of running it."],
        ["2000s — SaaS", "You rented software; the vendor ran it. You still did the work."],
        ["2010s — PaaS / IaaS", "You rented the infrastructure underneath, too."],
        ["2020s — Copilots", "You rented suggestions. Helpful, but the cursor was still yours."],
        ["Now — AIaaW", "You rent completed work: roles, not tools. Outcomes, not features."],
      ]},
      { t: "p", x: "AIaaW — AI as a Workforce — is the model where you subscribe to a role: a bookkeeper, a market analyst, a support team. The vendor's obligation is no longer uptime. It's output." },
      { t: "h", x: "How the economics flip" },
      { t: "vs", head: ["SaaS pricing", "AIaaW pricing"], rows: [
        ["Per seat, per month", "Per role or per outcome"],
        ["More users = more revenue", "More work = more revenue"],
        ["ROI argued in demos", "ROI visible in the ledger"],
        ["Churn when unused", "Churn when it underperforms"],
      ]},
      { t: "h", x: "The buyer's checklist" },
      { t: "checks", x: ["Outcome-level SLA", "Full audit trail", "Your data stays yours", "Human escalation path", "Role-based pricing", "Exit without lock-in"] },
      { t: "p", x: "Buy AIaaW the way you'd hire: interview it (demo on your real data), give it a probation period, review its work weekly — and fire it if it can't hold the role." },
    ],
  },
  {
    id: "enterprise-brain", kind: "Essay", title: "The Enterprise Brain: Organizational Memory in the Age of AI",
    dek: "Companies forget. Every resignation, every archived channel, every undocumented decision is amnesia. AI-native companies remember.",
    blocks: [
      { t: "p", x: "Ask any company why a decision was made three years ago and watch the archaeology begin: old slides, departed employees, a thread nobody can find. Institutional knowledge has always lived in heads — and heads walk out the door." },
      { t: "h", x: "The memory pipeline" },
      { t: "flow", x: ["Capture", "Structure", "Retrieve", "Apply", "Update"], loop: true },
      { t: "h", x: "Four kinds of memory an enterprise brain holds" },
      { t: "grid", x: [
        ["Episodic", "Every interaction, deal, and incident — what happened, when, with whom."],
        ["Semantic", "Facts: customers, products, prices, policies, suppliers — always current."],
        ["Procedural", "How work is done here: the playbooks agents execute and refine."],
        ["Strategic", "Why decisions were made — the reasoning, not just the outcome."],
      ]},
      { t: "p", x: "The compounding effect is the point. A company whose every loop writes back to shared memory gets smarter with each cycle; its agents onboard in seconds with full context; its new hires inherit ten years of judgment on day one." },
      { t: "pull", x: "Culture is what a company remembers without being asked. Now remembering is infrastructure." },
    ],
  },
  {
    id: "a2a-commerce", kind: "Frontier", title: "Agent-to-Agent Commerce: When Businesses Negotiate with Businesses",
    dek: "Your procurement agent is about to meet their sales agent. Markets are going machine-speed.",
    blocks: [
      { t: "p", x: "Today, B2B commerce runs at the speed of email: quote requests, follow-ups, redlines, invoices. When both sides field agents, that entire choreography compresses from weeks to minutes — continuously, at 3 a.m., across every supplier at once." },
      { t: "h", x: "Anatomy of an agent-to-agent deal" },
      { t: "flow", x: ["Discover", "Verify identity", "Exchange terms", "Negotiate", "Contract", "Settle", "Review"], loop: true },
      { t: "p", x: "A procurement agent broadcasts a need; supplier agents respond with structured offers; negotiation happens in rounds of machine-readable terms; a contract is generated, signed under delegated authority, and settled — with every round logged for human audit." },
      { t: "h", x: "What must be true before you let agents spend" },
      { t: "checks", x: ["Hard spend limits", "Human approval above thresholds", "Verified agent identity", "Immutable audit logs", "Dispute & rollback paths", "No irreversible actions unattended"] },
      { t: "p", x: "The upside is real: continuous price discovery, instant requotes when markets move, and small companies negotiating with the leverage of large ones. The risk is equally real, which is why the winners of A2A commerce will be the ones with the best guardrails — not the fastest agents." },
    ],
  },
  {
    id: "mena-ai-playbook", kind: "Playbook · MENA", title: "The MENA Founder's AI Playbook",
    dek: "Deploying agents in dual-currency, WhatsApp-first, trilingual markets — where the generic advice breaks.",
    blocks: [
      { t: "p", x: "Most AI playbooks quietly assume a world: one language, card payments, a stable grid, Delaware. MENA founders operate somewhere else entirely — and it turns out that somewhere else is where agents earn their keep fastest, because the operational load they absorb is heavier here." },
      { t: "h", x: "Five realities your agents must be built for" },
      { t: "tl", x: [
        ["01 — Trilingual by default", "A single customer thread can open in Levantine Arabic, switch to French, and close in English. Agents must follow the customer's language, not force one — and know that Gulf Arabic is not Lebanese Arabic."],
        ["02 — WhatsApp is the storefront", "Sales, support, ordering, and payment confirmations live in chat, not on your website. The funnel is a conversation; agents that can't work a WhatsApp thread can't work the market."],
        ["03 — Cash and dual currency", "Cash on delivery is normal; Lebanon runs on fresh USD alongside LBP. Agents must reconcile COD, quote in the right currency, and never assume a card on file."],
        ["04 — Infrastructure has gaps", "Power and connectivity are interruptible. Loops must be asynchronous and resumable — work queues that survive an outage, not sessions that die with it."],
        ["05 — Trust is relational", "Business travels through family, community, and diaspora networks. Outreach that ignores the relationship layer reads as spam; agents should warm leads through referrals, not cold blasts."],
      ]},
      { t: "h", x: "The imported playbook vs. the regional one" },
      { t: "vs", head: ["Silicon Valley playbook", "MENA playbook"], rows: [
        ["One language, one tone", "Arabic + French + English, matched per customer"],
        ["Card payments assumed", "COD + wallets + fresh-dollar reconciliation"],
        ["Email-first funnels", "WhatsApp-first funnels"],
        ["Hire ahead of growth", "Rent agents; keep the fresh-USD burn low"],
        ["Go deep in one market", "Build the Beirut → GCC corridor early"],
      ]},
      { t: "h", x: "Where agents pay off first" },
      { t: "checks", x: ["WhatsApp support loop", "Arabic/French content engine", "COD reconciliation", "Customs & shipping paperwork", "VAT filings on time", "Diaspora outreach"] },
      { t: "p", x: "Notice what's on that list: unglamorous, recurring, error-prone work. That's deliberate. In this region the fastest ROI isn't a strategy agent — it's the agent that answers every WhatsApp message within a minute in the customer's own dialect, and the one that makes sure the VAT filing never slips." },
      { t: "h", x: "The 90-day rollout" },
      { t: "tl", x: [
        ["Days 1–14", "Pick one loop — support or content. Feed the agent your tone, price list, and policies. Run it shadowed: it drafts, a human sends."],
        ["Days 15–30", "Calibrate dialect, formality, and edge cases until corrections drop near zero. Then let it send routine replies unattended, with escalation rules."],
        ["Days 31–60", "Add the back office: COD reconciliation, invoice chasing, customs paperwork. Boring loops, measurable savings."],
        ["Days 61–90", "Wire everything into a single COO briefing. Then point the growth agent at your first GCC channel — the corridor, not just the home market."],
      ]},
      { t: "h", x: "Regional guardrails" },
      { t: "checks", x: ["Human approval on all payments", "Bilingual audit logs", "Data-residency awareness (GCC rules differ)", "Ramadan & holiday-aware scheduling", "Cross-border compliance checks", "Escalate sensitive threads to a human"] },
      { t: "pull", x: "MENA founders have always done more with less. Agents don't change that instinct — they industrialize it." },
      { t: "p", x: "The constraint is the advantage. Teams here already run lean, improvise around infrastructure, and hold customer relationships personally. An AI workforce amplifies exactly those muscles — which is why the most interesting autonomous companies of the next decade may not come from where the playbooks are written, but from where they had to be rewritten." },
    ],
  },
  {
    id: "year-2035", kind: "Scenario · Fiction", title: "2035: Inside the World's First Fully Autonomous Company",
    dek: "A speculative tour of a company run by seven humans and three hundred agents. Fiction — for now.",
    blocks: [
      { t: "p", x: "What follows is a scenario, not a report — a plausible day inside a company at Level 5 autonomy, a decade out." },
      { t: "stats", x: [["7", "humans"], ["300+", "agents"], ["1", "morning briefing"], ["24/7", "operating rhythm"]] },
      { t: "h", x: "One day, on the record" },
      { t: "tl", x: [
        ["00:12", "Inventory agents rebalance stock across three warehouses after a demand-forecast update."],
        ["03:14", "The pricing agent closes a supplier renegotiation with a counterpart agent in another timezone. Savings logged, contract filed."],
        ["06:00", "The COO agent publishes the daily briefing: two decisions need humans today."],
        ["09:00", "The seven humans meet for fifty minutes. They approve one decision, reject one, and spend the rest on next year's direction."],
        ["12:40", "The product loop ships an improvement; the verification agent watches the rollout and holds the second phase pending metrics."],
        ["18:00", "The investor-relations agent updates the board portal. The learning layer writes the day to memory."],
      ]},
      { t: "h", x: "What the humans still own" },
      { t: "checks", x: ["Direction", "Taste", "Ethics", "Relationships", "Accountability", "The kill switch"] },
      { t: "p", x: "The uncomfortable part of this scenario isn't the technology — most of it exists in early form today. It's the management question: what do you do with human attention when execution is free? The companies experimenting now are writing the answer. 2035 is a scenario. The direction is not." },
    ],
  },
];

const KIND_ORDER = ["loop-engineering"];

// ——— infographic block renderer ———
function ArtBlocks({ blocks }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === "p") return <p key={i}>{b.x}</p>;
        if (b.t === "code") return <pre key={i} className="art-code">{b.x}</pre>;
        if (b.t === "pull") return <blockquote key={i} className="pull">{b.x}</blockquote>;
        if (b.t === "h") return <h2 key={i} className="sub" style={{ marginTop: 34 }}>{b.x}</h2>;
        if (b.t === "stats") return (
          <div key={i} className="ig-band" style={{ margin: "20px 0" }}>
            {b.x.map(([n, l]) => <div key={l} className="ig-stat"><span className="ig-n">{n}</span><span className="dim-t">{l}</span></div>)}
          </div>
        );
        if (b.t === "flow") return (
          <div key={i} className="loop-flow">
            {b.x.map((s, j) => (
              <React.Fragment key={s}>
                <span className="loop-stage"><span className="hex">{j + 1}</span>{s}</span>
                {j < b.x.length - 1 && <span className="loop-arrow">→</span>}
              </React.Fragment>
            ))}
            {b.loop && <span className="loop-arrow">↺</span>}
          </div>
        );
        if (b.t === "vs") return (
          <div key={i} className="vs">
            <div className="vs-head"><span>{b.head[0]}</span><span>{b.head[1]}</span></div>
            {b.rows.map(([l, r], j) => <div key={j} className="vs-row"><span>{l}</span><span>{r}</span></div>)}
          </div>
        );
        if (b.t === "tl") return (
          <div key={i} className="loop-anatomy" style={{ margin: "18px 0" }}>
            {b.x.map(([label, body], j) => (
              <div key={j} className="loop-layer">
                <span className="ig-role-n" style={{ minWidth: 58 }}>{label.split(" — ")[0]}</span>
                <div><strong>{label.includes(" — ") ? label.split(" — ")[1] : ""}</strong><p className="dim-t" style={{ margin: "3px 0 0" }}>{body}</p></div>
              </div>
            ))}
          </div>
        );
        if (b.t === "grid") return (
          <div key={i} className="loop-cases" style={{ margin: "18px 0" }}>
            {b.x.map(([t, body]) => (
              <div key={t} className="kn-card" style={{ cursor: "default" }}>
                <h3 style={{ fontSize: 15 }}>{t}</h3>
                <p className="dim-t" style={{ margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        );
        if (b.t === "checks") return (
          <div key={i} className="ig-report" style={{ margin: "16px 0" }}>
            {b.x.map((c) => <span key={c} className="ig-check">✓ {c}</span>)}
          </div>
        );
        return null;
      })}
    </>
  );
}

function ArticlePage({ id, go }) {
  if (id === "loop-engineering" || !id) return <LoopArticle go={go} />;
  const art = ARTICLES.find((a) => a.id === id);
  if (!art) return <main className="wrap"><p>Article not found.</p></main>;
  return (
    <main className="wrap article">
      <button className="link dim" onClick={() => go("knowledge")}>← Knowledge resources</button>
      <p className="eyebrow" style={{ marginTop: 20 }}>{art.kind}</p>
      <h1>{art.title}</h1>
      <p className="lede">{art.dek}</p>
      <ArtBlocks blocks={art.blocks} />
      <div className="row" style={{ marginTop: 30 }}>
        <button className="btn" onClick={() => go("home")}>See the hive in action →</button>
        <button className="btn ghost" onClick={() => go("knowledge")}>More resources</button>
      </div>
    </main>
  );
}


// ════════ METHODOLOGY ════════
const METHOD_BLOCKS = [
  { t: "p", x: "zhive isn't a chatbot with a catalog. Under every brief you receive there's an operating method — seven principles that decide how work is routed, checked, priced, and delivered. Here's exactly how it works, because you're paying for it." },
  { t: "h", x: "1 · Outcome bundles — rent results, not org charts" },
  { t: "p", x: "Nobody wakes up wanting a 'KPI Monitor'. You want your first 100 customers, or admin off your plate, or a Gulf channel open. So agents are packaged around outcomes — Launch Pack, Back-Office Pack, GCC Expansion Pack — priced below the sum of their parts. Single rentals stay available as the front door." },
  { t: "h", x: "2 · Tiered intelligence — the right-sized model per task" },
  { t: "flow", x: ["Classify task", "Route by weight", "Light / Standard / Deep", "Deliver"] },
  { t: "p", x: "Not every task deserves the most expensive model. Quick checks and QA reviews run on fast light-tier models; specialist briefs run standard; only synthesis and executive strategy run deep. You get the same quality at a fraction of the compute — which is exactly why the rentals can cost what a freelancer charges per hour, per month." },
  { t: "h", x: "3 · The quality loop — no raw output reaches you" },
  { t: "flow", x: ["Draft", "QA review", "Revise if flagged", "Deliver"], loop: true },
  { t: "p", x: "Every piece of work passes a second, independent review against a rubric — specific, on-specialty, actionable, right language — before you see it. If it fails, it's revised first. You'll see the QA badge on every output. Agents whose work keeps getting flagged get their instructions rewritten: quality compounds weekly." },
  { t: "h", x: "4 · One intake, shared memory" },
  { t: "p", x: "You describe your business once — product, market, tone, goals — in your workspace profile. Every agent reads it automatically, forever. No re-explaining yourself to each new agent, and every output arrives already in your voice and context. The longer your memory lives here, the sharper the hive gets." },
  { t: "h", x: "5 · WhatsApp-native delivery" },
  { t: "p", x: "In this region the funnel is a conversation. Every output has a one-tap 'Send to WhatsApp' — briefs, replies, and content go where your business actually happens, not into another dashboard you'll forget to open." },
  { t: "h", x: "6 · Measured everything" },
  { t: "checks", x: ["Activation rate", "Runs per workspace", "Demo → paid conversion", "QA pass rate"] },
  { t: "p", x: "We instrument the product the way we tell you to instrument your business. If those numbers don't improve, nothing else we build matters — so they're reviewed before anything ships." },
  { t: "h", x: "7 · Built with partners" },
  { t: "p", x: "Accelerators and incubators across the region can deploy zhive for entire cohorts — one workspace per founder, one control panel for the program. If you run a program in Lebanon or the GCC, talk to us." },
  { t: "h", x: "The method, side by side" },
  { t: "vs", head: ["Typical AI tool", "The zhive method"], rows: [
    ["One model for everything", "Right-sized model per task"],
    ["Raw first-draft output", "QA-reviewed, revised if flagged"],
    ["Re-explain your business each chat", "One profile, every agent informed"],
    ["Lives in a dashboard", "Delivers to WhatsApp"],
    ["Sells features", "Sells outcomes"],
  ]},
  { t: "pull", x: "Quality is a loop. Cost is a routing decision. Memory is the moat." },
];


// ════════ PIPELINES — how loop engineering works, step by step ════════
function PipelinesPage({ go, session }) {
  const STEPS = [
    ["01 · One task in", "You write a single instruction — \"Q4 plan for entering the Saudi market\" — and your business profile (product, market, tone, goals) is attached automatically. You never re-explain your company to each agent."],
    ["02 · The first specialist drafts, live", "Agent one streams its brief token by token. No black box, no waiting screen — you watch the work being written."],
    ["03 · QA reviews every draft", "A separate reviewer agent checks the output against a rubric: specific names and numbers, stays on specialty, ends with concrete next actions. If it falls short, the agent revises once — before you ever see it."],
    ["04 · The handoff", "The delivered work is wrapped as context and passed to the next specialist with strict instructions: build on it, don't repeat it, stay in your lane. This is the L6 relay — agents cooperating like colleagues, not tabs."],
    ["05 · A stacked digest, not fragments", "The chain ends with every brief in one place: labeled, QA-tagged, WhatsApp-shareable. One input became a plan, a forecast, and the KPIs to track it — with nobody copy-pasting in between."],
    ["06 · You verify — the hive learns", "Every brief has 👍 / 👎. Approve a result and that agent quietly keeps it as a style example: your next runs match the tone, language, and level of detail you approved — per agent, per founder, automatically."],
    ["07 · Put it on a schedule — the full loop", "Any pipeline can run itself: pick daily or weekly and it executes on zhive's servers while you sleep — same QA cycle, same learning — with the digest waiting in your workspace every morning. That's the complete loop: observe, reason, execute, verify, learn, repeat."],
  ];
  const CHAINS = [
    ["Strategy Sprint", "Strategic Planner → Forecasting Agent → KPI Monitor", "A quarter plan, its financial projection, and the metrics that prove it. Runs on the free demo."],
    ["Launch Prep", "Market Research → Pricing Agent → Content Writer", "Know the market, price the offer, and walk away with launch copy."],
    ["Competitor Scan", "Competitor Intelligence → Strategic Planner", "Map competitor moves, then turn the findings into your counter-strategy."],
    ["Investor Update", "Finance Agent → Board Reporter", "A financial brief distilled into a board-ready update."],
  ];
  return (
    <main className="wrap">
      <section className="section">
        <p className="eyebrow">Pipelines · Loop engineering in practice</p>
        <h1>One input. A chain of specialists. Zero copy-paste.</h1>
        <p className="lede">
          A pipeline is several AI agents pre-connected in a row. You give one task; agent one does its
          specialist work, a QA agent reviews it, and the result is handed to the next specialist — who builds
          on it instead of starting over. The chain ends with a stack of QA-checked briefs from a single input.
          Approve the good ones and the agents learn your style. Put the pipeline on a schedule and it runs
          without you — the digest is waiting every morning.
        </p>
      </section>

      <section className="section-sm">
        <h2 className="sub">Why this is different from a chatbot</h2>
        <p>
          A chatbot is one generalist with amnesia: every question starts from zero, you carry the context,
          and you are the quality control. A zhive pipeline inverts all three. Each step is a <strong>specialist</strong> with
          MENA-specific expertise, the <strong>context travels automatically</strong> from agent to agent through structured
          handoffs, and <strong>quality is enforced by a reviewer agent</strong> at every step — not by you re-reading and
          re-prompting. That is the practical difference between prompt engineering (you drive every turn) and
          loop engineering (the system drives the cycle: observe, reason, execute, verify, hand off).
        </p>
      </section>

      <section className="section-sm">
        <h2 className="sub">How a pipeline actually runs</h2>
        {STEPS.map(([t, d]) => (
          <div className="ws-agent" key={t}>
            <strong>{t}</strong>
            <p className="dim-t" style={{ margin: "4px 0 0" }}>{d}</p>
          </div>
        ))}
      </section>

      <section className="section-sm">
        <h2 className="sub">Feel the loop first — a 60-second simulation</h2>
        <p className="dim-t">
          This sandbox runs entirely in your browser: five products, one loop. Set a competitor price to
          <strong> Error</strong> to see how a well-engineered loop survives failure, then watch one digest fire only after
          the whole loop finishes.
        </p>
        <LoopLab />
      </section>

      <section className="section-sm">
        <h2 className="sub">The curated pipelines</h2>
        {CHAINS.map(([name, chain, d]) => (
          <div className="ws-agent" key={name}>
            <div className="row spread">
              <strong>{name}</strong>
              <span className="tag">CURATED</span>
            </div>
            <p className="dim-t" style={{ margin: "4px 0 0" }}>{chain}</p>
            <p style={{ margin: "6px 0 0" }}>{d}</p>
          </div>
        ))}
        <p className="dim-t" style={{ marginTop: 10 }}>
          You can also build your own: run any agent in your workspace, hand off to another, and press
          "Save pipeline" — your chain becomes a one-click tool forever.
        </p>
      </section>

      <section className="section-sm">
        <h2 className="sub">Try it for real — 6 steps, no card</h2>
        <p><strong>1.</strong> Start the free 24-hour demo (or create a free account — needed for scheduled loops).</p>
        <p><strong>2.</strong> In your workspace, fill the business profile once — every agent reads it automatically, forever.</p>
        <p><strong>3.</strong> Scroll to <strong>Pipelines</strong> and open <strong>Strategy Sprint</strong>. Type one real task, for example:
          <em> "Q4 plan for taking our product into the Saudi market."</em></p>
        <p><strong>4.</strong> Press Run and watch three specialists chain: plan → forecast → KPIs, each streaming live, each QA-checked, each building on the last.</p>
        <p><strong>5.</strong> Press <strong>👍</strong> on the briefs you like — from now on those agents write in the style you approved. (You can also chain agents manually with "Hand off", then "Save pipeline" to make your own.)</p>
        <p><strong>6.</strong> Pick <strong>every day</strong> or <strong>every week</strong> next to the Run button and press <strong>"⟳ Run on a schedule"</strong>. Your loop now runs itself — results land under <strong>Active loops</strong> in your workspace, no click required.</p>
        <div className="row" style={{ marginTop: 16 }}>
          {session ? (
            <button className="btn" onClick={() => go("workspace")}>Open your workspace →</button>
          ) : (
            <button className="btn" onClick={() => go("auth")}>Start the 24h demo →</button>
          )}
          <button className="btn ghost" onClick={() => go("article", "loop-engineering")}>Read: The Advent of Loop Engineering</button>
        </div>
      </section>
    </main>
  );
}


// ════════ READINESS LAB — test your product against laws, regulators, and competitors ════════
function LabPage({ go, session }) {
  const [form, setForm] = useState({
    name: "", desc: "", sector: "fintech", market: "Saudi Arabia",
    model: "", data: { payments: false, personal: false, health: false }, stage: "pre-launch",
  });
  const [phase, setPhase] = useState(null); // null | reg | comp | synth | done
  const [out, setOut] = useState({}); // { reg: {text,sources}, comp: {...}, synth: {text,sources} }
  const [err, setErr] = useState(null);
  // Deep Scrutiny (Lex) — stage B intake + legal risk register + law reading list
  const [lex, setLex] = useState({
    serviceType: "marketplace", holdsFunds: false, moneyFlow: "",
    storage: "not-decided", crossBorder: false, processors: "",
    entity: "", nationalities: "", licenses: "",
    arabicContracts: false, refunds: "", staff: "none",
  });
  const [lexOut, setLexOut] = useState(null); // {text, sources}
  const [lexRunning, setLexRunning] = useState(false);
  const [lexErr, setLexErr] = useState(null);
  const L = (k) => (e) => setLex((x) => ({ ...x, [k]: e.target.value }));
  const LB = (k) => () => setLex((x) => ({ ...x, [k]: !x[k] }));
  const [credits, setCredits] = useState(null);
  const refreshCredits = () => { if (session && !session.demo) store.getLabCredits(session).then(setCredits); };
  useEffect(refreshCredits, [session?.id]);
  const fullAccount = session && !session.demo;
  const waTopUp = (tier) => {
    const msg = encodeURIComponent(`Hi zhive — I'd like to top up the Readiness Lab: ${tier.name[0]} (${tier.price}, ${tier.credits} credits). My account email: ${session?.email || ""}`);
    window.open(`https://wa.me/${CONTACT_WA}?text=${msg}`, "_blank");
  };
  const F = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const D = (k) => () => setForm((f) => ({ ...f, data: { ...f.data, [k]: !f.data[k] } }));
  const running = phase && phase !== "done";

  const intake = () => {
    const dataTypes = Object.entries(form.data).filter(([, v]) => v).map(([k]) => ({ payments: "payment flows / customer funds", personal: "personal data (PII)", health: "health / medical data" }[k])).join(", ") || "not specified";
    return `PRODUCT: ${form.name || "Unnamed product"}\nDESCRIPTION: ${form.desc}\nSECTOR: ${LAB_SECTORS[form.sector].label[0]}\nTARGET MARKET: ${form.market}\nBUSINESS MODEL: ${form.model || "not specified"}\nDATA HANDLED: ${dataTypes}\nSTAGE: ${form.stage}`;
  };

  async function runLab() {
    if (!form.desc.trim() || running) return;
    setErr(null); setOut({}); setPhase("reg");
    const guide = LAB_SECTORS[form.sector].guide;
    try {
      // Step 1 — regulatory map (search-grounded)
      const reg = await callClaudeSearch(
        `You are the Regulatory Mapping agent of the zhive.xyz Readiness Lab, specialized in ${form.market} for the ${LAB_SECTORS[form.sector].label[0]} sector. Orientation (verify everything with current web searches — regulations change): ${guide}\n\nProduce a REGULATORY MAP for the product described: (1) which regulators have jurisdiction and why, (2) the most likely license category or registration path with typical requirements, (3) applicable regulatory sandbox programs if any, (4) RED FLAGS — data residency, localization, capital, ownership or product-structure issues that could block entry, (5) typical timeline. Use headings. Search the web for current official sources and base claims on them. Be specific with regulator names and rule references. If something is uncertain, say so explicitly. Never present this as legal advice.`,
        [{ role: "user", content: intake() }]
      );
      setOut((o) => ({ ...o, reg })); setPhase("comp");

      // Step 2 — competitive field (search-grounded)
      const comp = await callClaudeSearch(
        `You are the Competitive Field agent of the zhive.xyz Readiness Lab for ${form.market}. Search the web for CURRENT information. Produce: (1) the 4-7 most relevant licensed/operating competitors for this product in ${form.market} with one line each on their position, (2) how crowded and funded the space is, (3) visible gaps or underserved segments, (4) a realistic wedge this product could take, (5) local ecosystem notes (platforms, distribution channels, partnerships that matter). Use headings. Cite sources. Be honest if the space looks saturated.`,
        [{ role: "user", content: intake() }]
      );
      setOut((o) => ({ ...o, comp })); setPhase("synth");

      // Step 3 — synthesis: readiness verdict, adaptation checklist, lawyer questions
      const synth = await callClaude(
        `You are the Readiness Synthesis agent of the zhive.xyz Readiness Lab. You receive a regulatory map and a competitive analysis for a product entering ${form.market}. Produce the final section of the readiness report: (1) READINESS SCORE out of 10 with a two-sentence justification, (2) ADAPTATION CHECKLIST — what must change in the product before entry, ordered cheapest to most expensive, (3) GO / ADJUST / RETHINK verdict with reasoning, (4) "10 QUESTIONS FOR YOUR LAWYER" — the exact questions this founder should bring to licensed counsel in ${form.market}, (5) suggested next 30 days. Use headings. Be direct and honest — an inflated score harms the founder.`,
        [{ role: "user", content: `${intake()}\n\n=== REGULATORY MAP ===\n${reg.text.slice(0, 5000)}\n\n=== COMPETITIVE FIELD ===\n${comp.text.slice(0, 5000)}` }],
        "deep"
      );
      setOut((o) => ({ ...o, synth: { text: synth, sources: [] } }));
      store.logEvent("run", session);
      setPhase("done");
      refreshCredits();
    } catch (e) { setErr(e.message); setPhase(null); }
  }

  const lexIntake = () => `${intake()}
SERVICE STRUCTURE: ${lex.serviceType}
HOLDS CUSTOMER FUNDS: ${lex.holdsFunds ? "yes" : "no"}
MONEY FLOW: ${lex.moneyFlow || "not specified"}
DATA STORAGE / HOSTING: ${lex.storage}${lex.crossBorder ? " · transfers data across borders" : ""}
THIRD-PARTY PROCESSORS: ${lex.processors || "not specified"}
CORPORATE ENTITY: ${lex.entity || "not specified"}
FOUNDER NATIONALITIES: ${lex.nationalities || "not specified"}
EXISTING LICENSES: ${lex.licenses || "none stated"}
ARABIC CONTRACTS/TOS: ${lex.arabicContracts ? "yes" : "no"}
REFUND POLICY: ${lex.refunds || "not specified"}
PEOPLE IN MARKET: ${lex.staff}`;

  async function runLex() {
    if (lexRunning || !out.reg) return;
    setLexErr(null); setLexRunning(true);
    try {
      const r = await callClaudeSearch(
        `You are LEX, the legal-scrutiny agent of the zhive.xyz Readiness Lab for ${form.market}, sector: ${LAB_SECTORS[form.sector].label[0]}. You are a readiness COACH, not a lawyer: your job is to find where this founder's SPECIFIC structure collides with the actual legal texts, then teach them exactly which laws to read and what to look for — so they arrive at licensed counsel prepared. Search the web for the current official texts before citing anything.

Produce two sections with headings:

## Legal Risk Register
6-10 risks specific to THIS structure (not generic). For each: **Risk** — severity (HIGH/MEDIUM/LOW) — the specific law/regulation and article or section it stems from — why it applies to this exact setup — what document or answer their lawyer will ask for. Order by severity. If foreign ownership, agency law, fund-holding, data localization, consumer protection, labor classification, or Arabic-contract requirements are implicated by the intake, address them explicitly.

## Your Law Reading List — coached
The 5-8 primary legal texts this founder should personally read, each with: the official name (and number/year), where to find it (cite the official source you found via search), WHICH articles or chapters matter for this product, a one-line plain-language summary of what that part regulates, and ONE coaching question to answer while reading (e.g. "Reading art. 12-15, decide: does your checkout flow count as holding customer funds?"). Close with a short coach's note on reading order and how to bring findings to counsel.

Rules: cite sources for every legal claim; where you are not certain of the current text, say so plainly; never present anything as legal advice — you prepare the founder for their lawyer, you do not replace one.`,
        [{ role: "user", content: `${lexIntake()}\n\n=== ORIENTATION REPORT (context) ===\n${(out.reg?.text || "").slice(0, 3500)}` }],
        3200
      );
      setLexOut(r);
      store.logEvent("run", session);
      refreshCredits();
    } catch (e) { setLexErr(e.message); }
    setLexRunning(false);
  }

  const Section = ({ title, data }) => data ? (
    <div className="ws-agent">
      <div className="row spread">
        <strong>{title}</strong>
        <button className="link" onClick={() => waShare(data.text)}>{t("Send to WhatsApp →", "أرسل إلى واتساب ←")}</button>
      </div>
      <Markdown text={data.text} />
      {data.sources?.length > 0 && (
        <p className="dim-t small-t" style={{ marginTop: 8 }}>
          {t("Sources: ", "المصادر: ")}
          {data.sources.slice(0, 8).map((s, i) => (
            <span key={s.url}>{i > 0 && " · "}<a href={s.url} target="_blank" rel="noreferrer" className="link">{(s.title || s.url).slice(0, 60)}</a></span>
          ))}
        </p>
      )}
    </div>
  ) : null;

  return (
    <main className="wrap">
      <section className="section">
        <p className="eyebrow">{t("Readiness Lab · beta", "مختبر الجاهزية · تجريبي")}</p>
        <h1>{t("Test your product against the laws, regulators, and competitors of Arab markets.", "اختبر منتجك في مواجهة القوانين والجهات التنظيمية والمنافسين في الأسواق العربية.")}</h1>
        <p className="lede">
          {t(
            "Describe your product once. Three deep agents — armed with live web search — map the regulators that own you, scan the competitive field, and hand you a cited readiness report with the exact questions to bring to your lawyer. A month of orientation, compressed into minutes.",
            "صِف منتجك مرة واحدة. ثلاثة وكلاء متعمّقين — مزوّدين ببحث حي على الإنترنت — يرسمون خريطة الجهات التنظيمية، يمسحون ساحة المنافسة، ويسلّمونك تقرير جاهزية موثّق المصادر مع الأسئلة الدقيقة التي تحملها إلى محاميك."
          )}
        </p>
        <p className="dim-t small-t">{t(LAB_DISCLAIMER_EN, LAB_DISCLAIMER_AR)}</p>
      </section>

      {!fullAccount ? (
        <section className="section-sm">
          <p>
            {session?.demo
              ? t("The Lab runs live web research against official sources, so it needs a full (free) account — the 24h demo can't run it.", "يجري المختبر بحثًا حيًا في المصادر الرسمية، لذا يتطلب حسابًا كاملًا (مجانيًا) — التجربة لا تكفي لتشغيله.")
              : t("The Lab needs a free account. Every new account includes 8 Lab credits — about two full reports.", "يتطلب المختبر حسابًا مجانيًا. كل حساب جديد يتضمن 8 أرصدة للمختبر — نحو تقريرين كاملين.")}
          </p>
          <button className="btn" onClick={() => go("auth")}>{t("Create a free account →", "أنشئ حسابًا مجانيًا ←")}</button>
        </section>
      ) : (
        <section className="section-sm">
          <div className="row spread">
            <h2 className="sub">{t("1 · Describe your product", "1 · صِف منتجك")}</h2>
            {credits !== null && (
              <span className="tag">{t(`Lab credits: ${credits}`, `أرصدة المختبر: ${credits}`)}</span>
            )}
          </div>
          <p className="dim-t small-t">{t("Each searched step costs 1 credit — a full report with Lex uses 3. New accounts start with 8.", "كل خطوة بحث تكلف رصيدًا واحدًا — التقرير الكامل مع «لِكس» يستهلك 3. الحسابات الجديدة تبدأ بـ8.")}</p>
          <div className="ws-agent">
            <input value={form.name} onChange={F("name")} placeholder={t("Product name", "اسم المنتج")} />
            <textarea rows={3} value={form.desc} onChange={F("desc")}
              placeholder={t("What does it do, for whom, and how does it make money? Be concrete.", "ماذا يفعل، لمن، وكيف يحقق الدخل؟ كن محددًا.")} style={{ marginTop: 8 }} />
            <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
              <select value={form.sector} onChange={F("sector")} style={{ padding: "8px 10px" }}>
                {Object.entries(LAB_SECTORS).map(([k, v]) => <option key={k} value={k}>{t(v.label[0], v.label[1])}</option>)}
              </select>
              <select value={form.market} onChange={F("market")} style={{ padding: "8px 10px" }}>
                {LAB_MARKETS.map((m) => <option key={m}>{m}</option>)}
              </select>
              <select value={form.stage} onChange={F("stage")} style={{ padding: "8px 10px" }}>
                <option value="idea">{t("Idea stage", "مرحلة الفكرة")}</option>
                <option value="pre-launch">{t("Built, pre-launch", "جاهز، قبل الإطلاق")}</option>
                <option value="live-elsewhere">{t("Live in another market", "يعمل في سوق آخر")}</option>
              </select>
            </div>
            <input value={form.model} onChange={F("model")} placeholder={t("Business model (e.g. commission per transaction, SaaS subscription…)", "نموذج العمل (مثلاً عمولة على كل عملية، اشتراك شهري…)")} style={{ marginTop: 8 }} />
            <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 10 }}>
              <span className="dim-t small-t">{t("Your product touches:", "منتجك يتعامل مع:")}</span>
              {[["payments", t("Payments / customer funds", "مدفوعات / أموال العملاء")], ["personal", t("Personal data", "بيانات شخصية")], ["health", t("Health data", "بيانات صحية")]].map(([k, lbl]) => (
                <label key={k} className="row" style={{ gap: 5 }}>
                  <input type="checkbox" checked={form.data[k]} onChange={D(k)} /> <span className="small-t">{lbl}</span>
                </label>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={runLab} disabled={running || !form.desc.trim()}>
                {running ? t("Running the Lab…", "المختبر يعمل…") : t("Run the Readiness Lab →", "شغّل مختبر الجاهزية ←")}
              </button>
              {err && <span className="err">{err}</span>}
            </div>
            {running && (
              <p className="dim-t pulse" style={{ marginTop: 10 }}>
                {phase === "reg" && t("① Regulatory Mapping agent is searching official sources…", "① وكيل الخريطة التنظيمية يبحث في المصادر الرسمية…")}
                {phase === "comp" && t("② Competitive Field agent is scanning the market…", "② وكيل ساحة المنافسة يمسح السوق…")}
                {phase === "synth" && t("③ Synthesis agent is scoring readiness and drafting your lawyer questions…", "③ وكيل التوليف يقيّم الجاهزية ويصيغ أسئلة المحامي…")}
              </p>
            )}
          </div>

          {(out.reg || out.comp || out.synth) && (
            <>
              <h2 className="sub" style={{ marginTop: 26 }}>
                {t("2 · Market Entry Readiness Report", "2 · تقرير جاهزية دخول السوق")} — {form.name || t("your product", "منتجك")} · {form.market}
              </h2>
              <Section title={t("Regulatory map", "الخريطة التنظيمية")} data={out.reg} />
              <Section title={t("Competitive field", "ساحة المنافسة")} data={out.comp} />
              <Section title={t("Readiness verdict & lawyer questions", "حكم الجاهزية وأسئلة المحامي")} data={out.synth} />
              {phase === "done" && (
                <p className="dim-t small-t" style={{ marginTop: 10 }}>{t(LAB_DISCLAIMER_EN, LAB_DISCLAIMER_AR)}</p>
              )}

              {phase === "done" && (
                <>
                  <h2 className="sub" style={{ marginTop: 30 }}>{t("3 · Deep Scrutiny — Lex, your legal readiness coach", "3 · الفحص المعمّق — «لِكس»، مدرّبك للجاهزية القانونية")}</h2>
                  <p className="dim-t">
                    {t(
                      "Answer a few structural questions and Lex scrutinizes your exact setup against the actual legal texts — producing a Legal Risk Register and a coached reading list of the laws themselves, with what to look for in each. You arrive at your lawyer prepared, not blank.",
                      "أجب عن بضعة أسئلة بنيوية وسيفحص «لِكس» تركيبتك الفعلية في مواجهة النصوص القانونية نفسها — منتجًا سجلّ مخاطر قانونية وقائمة قراءة موجَّهة للقوانين ذاتها، مع ما تبحث عنه في كلٍّ منها. تصل إلى محاميك مستعدًا، لا فارغ اليدين."
                    )}
                  </p>
                  <div className="ws-agent">
                    <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                      <select value={lex.serviceType} onChange={L("serviceType")} style={{ padding: "8px 10px" }}>
                        <option value="marketplace">{t("Marketplace (connect buyers & sellers)", "منصة وساطة (تربط بائعين ومشترين)")}</option>
                        <option value="merchant-of-record">{t("Merchant of record (we sell directly)", "بائع مباشر")}</option>
                        <option value="saas">{t("SaaS / software subscription", "برمجيات كخدمة / اشتراك")}</option>
                        <option value="broker-agent">{t("Broker / agent / referrals", "وسيط / وكيل / إحالات")}</option>
                        <option value="lender-bnpl">{t("Lending / BNPL / financing", "إقراض / اشترِ الآن وادفع لاحقًا / تمويل")}</option>
                        <option value="care-provider">{t("Care provider / consultations", "مقدّم رعاية / استشارات")}</option>
                      </select>
                      <select value={lex.storage} onChange={L("storage")} style={{ padding: "8px 10px" }}>
                        <option value="not-decided">{t("Hosting: not decided", "الاستضافة: لم تُحدَّد")}</option>
                        <option value="in-market">{t("Hosted in the target market", "داخل السوق المستهدف")}</option>
                        <option value="gcc">{t("Hosted in the GCC", "في الخليج")}</option>
                        <option value="eu-us">{t("Hosted in EU / US", "في أوروبا / أميركا")}</option>
                        <option value="mixed">{t("Mixed / multi-region", "مختلط")}</option>
                      </select>
                      <select value={lex.staff} onChange={L("staff")} style={{ padding: "8px 10px" }}>
                        <option value="none">{t("No staff in market yet", "لا موظفين في السوق بعد")}</option>
                        <option value="freelancers">{t("Freelancers in market", "مستقلّون في السوق")}</option>
                        <option value="employees">{t("Employees in market", "موظفون في السوق")}</option>
                      </select>
                    </div>
                    <input value={lex.moneyFlow} onChange={L("moneyFlow")} style={{ marginTop: 8 }}
                      placeholder={t("Money flow: who pays whom, when, in what currency? (e.g. buyer pays us, we pay seller weekly minus 8%)", "تدفق الأموال: من يدفع لمن ومتى وبأي عملة؟")} />
                    <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 12 }}>
                      <label className="row" style={{ gap: 5 }}><input type="checkbox" checked={lex.holdsFunds} onChange={LB("holdsFunds")} /> <span className="small-t">{t("We hold customer funds at any point", "نحتفظ بأموال العملاء في أي مرحلة")}</span></label>
                      <label className="row" style={{ gap: 5 }}><input type="checkbox" checked={lex.crossBorder} onChange={LB("crossBorder")} /> <span className="small-t">{t("Data crosses borders", "البيانات تعبر الحدود")}</span></label>
                      <label className="row" style={{ gap: 5 }}><input type="checkbox" checked={lex.arabicContracts} onChange={LB("arabicContracts")} /> <span className="small-t">{t("Our contracts/ToS exist in Arabic", "عقودنا/شروطنا متوفرة بالعربية")}</span></label>
                    </div>
                    <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
                      <input value={lex.entity} onChange={L("entity")} placeholder={t("Entity & jurisdiction (e.g. SARL Lebanon, DIFC Ltd, none yet)", "الكيان القانوني ومكانه")} style={{ flex: 1, minWidth: 200 }} />
                      <input value={lex.nationalities} onChange={L("nationalities")} placeholder={t("Founder nationalities", "جنسيات المؤسسين")} style={{ flex: 1, minWidth: 160 }} />
                    </div>
                    <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
                      <input value={lex.processors} onChange={L("processors")} placeholder={t("Third parties touching data/money (e.g. Stripe, AWS, Checkout.com)", "أطراف ثالثة تلمس البيانات/الأموال")} style={{ flex: 1, minWidth: 200 }} />
                      <input value={lex.licenses} onChange={L("licenses")} placeholder={t("Licenses you already hold, if any", "تراخيص تملكها حاليًا، إن وُجدت")} style={{ flex: 1, minWidth: 160 }} />
                    </div>
                    <input value={lex.refunds} onChange={L("refunds")} style={{ marginTop: 8 }}
                      placeholder={t("Refund/cancellation policy in one line", "سياسة الاسترجاع/الإلغاء في سطر واحد")} />
                    <div className="row" style={{ marginTop: 12 }}>
                      <button className="btn" onClick={runLex} disabled={lexRunning}>
                        {lexRunning ? t("Lex is reading the law…", "«لِكس» يقرأ القانون…") : t("Run Deep Scrutiny →", "شغّل الفحص المعمّق ←")}
                      </button>
                      {lexErr && <span className="err">{lexErr}</span>}
                    </div>
                    {lexRunning && <p className="dim-t pulse" style={{ marginTop: 8 }}>{t("Searching official legal texts and building your risk register + reading list…", "يبحث في النصوص القانونية الرسمية ويبني سجلّ المخاطر وقائمة القراءة…")}</p>}
                  </div>
                  {lexOut && (
                    <>
                      <Section title={t("Legal risk register & your coached law reading list", "سجلّ المخاطر القانونية وقائمة قراءة القوانين الموجَّهة")} data={lexOut} />
                      <p className="dim-t small-t" style={{ marginTop: 10 }}>{t(LAB_DISCLAIMER_EN, LAB_DISCLAIMER_AR)}</p>
                    </>
                  )}
                </>
              )}
            </>
          )}

          <h2 className="sub" style={{ marginTop: 34 }}>{t("Lab pricing — beta", "أسعار المختبر — النسخة التجريبية")}</h2>
          <p className="dim-t">
            {t(
              "Card payments are coming; during beta, top-ups are activated manually within hours — tap a tier to message us on WhatsApp with your account email.",
              "الدفع بالبطاقة قادم؛ خلال النسخة التجريبية تُفعَّل الأرصدة يدويًا خلال ساعات — اضغط على الباقة لمراسلتنا على واتساب مع بريد حسابك."
            )}
          </p>
          {LAB_PRICING.map((p) => (
            <div key={p.name[0]} className="ws-agent">
              <div className="row spread">
                <div>
                  <strong>{t(p.name[0], p.name[1])}</strong>
                  <span className="dim-t"> · {p.credits} {t("credits", "أرصدة")}</span>
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <strong>{p.price}</strong>
                  <button className="btn small ghost" onClick={() => waTopUp(p)}>{t("Top up via WhatsApp →", "اشحن عبر واتساب ←")}</button>
                </div>
              </div>
              <p className="dim-t" style={{ margin: "4px 0 0" }}>{t(p.desc[0], p.desc[1])}</p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function MethodPage({ go }) {
  return (
    <main className="wrap article">
      <p className="eyebrow">The method</p>
      <h1>How zhive works under the hood</h1>
      <p className="lede">Seven operating principles behind every brief — routing, quality, memory, and delivery, explained.</p>
      <ArtBlocks blocks={METHOD_BLOCKS} />
      <div className="row" style={{ marginTop: 30 }}>
        <button className="btn" onClick={() => go("directory")}>Browse bundles & agents →</button>
        <button className="btn ghost" onClick={() => go("auth")}>Start the 24h demo</button>
      </div>
    </main>
  );
}

// ════════ DIRECTORY ════════
function Directory({ go, inCart, addToCart }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...DIR_LIST.map((c) => c.cat)];
  const list = DIR_AGENTS.filter(
    (a) => (cat === "All" || a.layerName === cat) && a.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <main className="wrap">
      <p className="eyebrow">Agent directory · rent by the month</p>
      <h1>Choose your specialist</h1>
      <p className="lede">
        {DIR_AGENTS.length} rentable agents across {DIR_LIST.length} categories — each with its own page, case study,
        implementation plan, and live demo. Add to cart to rent; cancel monthly.
      </p>
      <h2 className="sub" style={{ marginTop: 26 }}>Outcome bundles</h2>
      <div className="dir-grid" style={{ marginBottom: 30 }}>
        {BUNDLES.map((b) => (
          <div key={b.id} className="dir-card" style={{ borderLeft: "4px solid var(--ink)" }}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>{b.outcome}</p>
            <h3>{b.name}</h3>
            <p className="dim-t" style={{ flex: 1 }}>{b.items.map((x) => getAgent(x)?.name).join(" + ")}</p>
            <div className="row spread" style={{ marginTop: 14 }}>
              <span><strong>${b.price}/mo</strong> <span className="dim-t" style={{ textDecoration: "line-through" }}>${b.sum}</span></span>
              {inCart(b.id) ? (
                <button className="btn small ghost" onClick={() => go("cart")}>In cart</button>
              ) : (
                <button className="btn small" onClick={() => addToCart(b.id)}>Rent bundle</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="sub">Single agents</h2>
      <div className="dir-controls">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents — e.g. bookkeeper, Arabic, ads…" />
        <div className="chips">
          {cats.map((c) => (
            <button key={c} className={"chip" + (cat === c ? " chip-on" : "")} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>
      {list.length === 0 && <p className="dim-t">No agents match — try a different search or category.</p>}
      <div className="dir-grid">
        {list.map((a) => (
          <div key={a.id} className="dir-card">
            <p className="eyebrow" style={{ marginBottom: 6 }}>{a.layerName}</p>
            <h3>{a.name}</h3>
            <p className="dim-t" style={{ flex: 1 }}>{a.caseStudy.title}</p>
            <div className="row spread" style={{ marginTop: 14 }}>
              <strong>${a.price}/mo</strong>
              <div className="row" style={{ gap: 8 }}>
                <button className="link" onClick={() => go("agent", a.id)}>Page →</button>
                {inCart(a.id) ? (
                  <button className="btn small ghost" onClick={() => go("cart")}>In cart</button>
                ) : (
                  <button className="btn small" onClick={() => addToCart(a.id)}>Rent</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// ════════ AGENT PAGE ════════
function AgentPage({ agent, go, inCart, addToCart, session, biz }) {
  const [demoInput, setDemoInput] = useState("");
  const [steps, setSteps] = useState([]); // pipeline: [{ agent, text, qa }]
  const [live, setLive] = useState(null); // { phase, text, agent } while streaming
  const [err, setErr] = useState(null);
  const busy = live !== null;

  if (!agent) return <main className="wrap"><p>Agent not found.</p></main>;

  async function runDemo() {
    if (!demoInput.trim() || busy) return;
    setErr(null); setSteps([]);
    setLive({ phase: "drafting", text: "", agent });
    try {
      const r = await runAgentTaskFor(session, agent, demoInput, biz, (u) => setLive({ ...u, agent }));
      store.logEvent("run", session);
      setSteps([{ agent, ...r }]);
    } catch (e) { setErr(e.message); }
    setLive(null);
  }

  function feedback(i, verdict) {
    const s = steps[i];
    if (!s) return;
    store.saveFeedback(session, { agentId: s.agent.id, verdict, text: s.text, task: demoInput });
    setSteps((list) => list.map((x, idx) => (idx === i ? { ...x, fb: verdict } : x)));
  }

  async function handoff(toId) {
    const toAgent = getAgent(toId);
    const prev = steps[steps.length - 1];
    if (!toAgent || !prev || busy) return;
    setErr(null);
    setLive({ phase: "drafting", text: "", agent: toAgent });
    try {
      const input = handoffInput(prev.agent, toAgent, demoInput, prev.text);
      const r = await runAgentTaskFor(session, toAgent, input, biz, (u) => setLive({ ...u, agent: toAgent }));
      store.logEvent("run", session);
      setSteps((s) => [...s, { agent: toAgent, ...r }]);
    } catch (e) { setErr(e.message); }
    setLive(null);
  }

  return (
    <main className="wrap">
      <button className="link dim" onClick={() => go(agent.rentable ? "directory" : "home")}>
        ← {agent.rentable ? "Directory" : "All agents"}
      </button>
      <div className="agent-head">
        <div>
          <p className="eyebrow">{agent.rentable ? "Directory" : agent.layer} · {agent.layerName}</p>
          <h1>{agent.name}</h1>
          <p className="lede">{agent.tagline}</p>
        </div>
        <div className="buy-box">
          <p className="price">${agent.price}<span>/mo</span></p>
          <p className="dim-t">{agent.rentable ? "Monthly rental · cancel anytime · work stays yours" : "Cancel anytime · outputs feed your COO report"}</p>
          {inCart(agent.id) ? (
            <button className="btn ghost" onClick={() => go("cart")}>In cart — view cart →</button>
          ) : (
            <button className="btn" onClick={() => addToCart(agent.id)}>{agent.rentable ? "Rent — add to cart" : "Add to cart"}</button>
          )}
        </div>
      </div>

      <div className="agent-grid">
        <section>
          <h2 className="sub">Synopsis</h2>
          <ul className="clean">{agent.synopsis.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>

        <section>
          <h2 className="sub">Case study</h2>
          <p className="case-title">{agent.caseStudy.title}</p>
          <p>{agent.caseStudy.body}</p>
        </section>

        <section>
          <h2 className="sub">Implementation advice</h2>
          <ul className="clean">{agent.implementation.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </section>

        <section>
          <h2 className="sub">Live demo</h2>
          {!session && <p className="dim-t">Sign in or start the 24-hour demo account to run this agent — <button className="link" onClick={() => go("auth")}>get access →</button></p>}
          {session && (
            <>
              {biz?.product && <p className="dim-t small-t" style={{ margin: "0 0 8px" }}>Your business profile is attached automatically — just describe the task.</p>}
              <textarea rows={3} value={demoInput} onChange={(e) => setDemoInput(e.target.value)}
                placeholder={biz?.product ? "What should this agent work on?" : "Describe your business in a sentence or two — product, market, current stage…"} />
              <div className="row">
                <button className="btn small" onClick={runDemo} disabled={busy || !demoInput.trim()}>
                  {busy ? "Running…" : steps.length ? "Run again" : "Run demo"}
                </button>
                {err && <span className="err">{err} — try again.</span>}
              </div>
              <ChainView steps={steps} live={live} onFeedback={feedback} />
              {steps.length > 0 && !busy && (
                <HandoffBar
                  currentId={steps[steps.length - 1].agent.id}
                  options={AGENTS}
                  onHandoff={handoff}
                  busy={busy}
                />
              )}
              {session && <VoiceTalk agent={agent} biz={biz} />}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

// ════════ CART ════════
function CartPage({ cart, removeFromCart, total, checkout, session, busy, go }) {
  const signedIn = session && !session.demo;
  return (
    <main className="wrap narrow">
      <h1>Cart</h1>
      {cart.length === 0 && <p className="dim-t">Your cart is empty. <button className="link" onClick={() => go("directory")}>Browse agents →</button></p>}
      {cart.map((id) => {
        const a = getItem(id);
        return (
          <div key={id} className="cart-row">
            <div>
              <strong>{a.name}</strong>
              <span className="dim-t"> · {a.bundle ? `bundle · includes ${a.items.map((x) => getAgent(x)?.name).join(", ")}` : a.layerName}</span>
            </div>
            <div className="row">
              <span>${a.price}/mo</span>
              <button className="link dim" onClick={() => removeFromCart(id)}>Remove</button>
            </div>
          </div>
        );
      })}
      {cart.length > 0 && (
        <>
          <div className="cart-row total"><strong>Total</strong><strong>${total}/mo</strong></div>
          {!signedIn && (
            <p className="dim-t">
              {session?.demo ? "Demo accounts can't purchase — create a free account to check out." : "Sign in to check out."}{" "}
              <button className="link" onClick={() => go("auth")}>Create account →</button>
            </p>
          )}
          <button className="btn" disabled={!signedIn || busy} onClick={checkout}>
            {busy ? "Recording order…" : "Confirm purchase (prototype — no payment taken)"}
          </button>
          <p className="dim-t small-t">This prototype records the order to your workspace without processing any payment.</p>
        </>
      )}
    </main>
  );
}

// ════════ AUTH ════════
function AuthPage({ signup, login, startDemo }) {
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true); setErr(null); setPending(false);
    const e = mode === "signup" ? await signup(name.trim(), email.trim(), pass) : await login(email.trim(), pass);
    if (e === "PENDING") setPending(true);
    else setErr(e);
    setBusy(false);
  }

  return (
    <main className="wrap narrow">
      <h1>{mode === "signup" ? "Create your workspace" : "Sign in"}</h1>
      <p className="dim-t">Your workspace tracks your agents, purchases, and every brief the hive produces for you.</p>
      {mode === "signup" && (<><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rania Khoury" /></>)}
      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      <label>Password</label>
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
      {err && <p className="err">{err}</p>}
      {pending && <p className="dim-t" style={{ marginTop: 10 }}>Almost there — check your email for a confirmation link, then sign in here.</p>}
      <div className="row" style={{ marginTop: 18 }}>
        <button className="btn" onClick={submit} disabled={busy}>{busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}</button>
        <button className="link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErr(null); setPending(false); }}>
          {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
        </button>
      </div>
      <div className="demo-cta">
        <p><strong>Just looking?</strong> Try the full workspace free for 24 hours — no email, no card.</p>
        <button className="btn ghost" onClick={startDemo}>Start 24-hour demo →</button>
      </div>
      {!isCloud && <p className="dim-t small-t">Prototype mode: accounts live in memory and reset on refresh. Don't use a real password.</p>}
    </main>
  );
}

// ════════ WORKSPACE ════════
function Workspace({ session, purchases, myOrders, biz, saveBiz, go, startDemo }) {
  const [running, setRunning] = useState({}); // agentId -> {input, steps, live, err, pipeName}
  const [pipes, setPipes] = useState([]); // saved pipelines
  const [pRun, setPRun] = useState({}); // pipelineId -> {input, steps, live, err}
  const [loops, setLoops] = useState([]); // scheduled loops
  const [loopRuns, setLoopRuns] = useState([]); // recent cron run results
  const [openRun, setOpenRun] = useState(null); // expanded run id
  const [bizDraft, setBizDraft] = useState(biz || { product: "", market: "", tone: "", goals: "" });
  const [bizSaved, setBizSaved] = useState(false);
  useEffect(() => { setBizDraft(biz || { product: "", market: "", tone: "", goals: "" }); }, [biz]);
  useEffect(() => {
    if (session) {
      store.getPipelines(session).then(setPipes);
      store.getLoops(session).then(setLoops);
      store.getLoopRuns(session).then(setLoopRuns);
    } else { setPipes([]); setLoops([]); setLoopRuns([]); }
  }, [session?.id]);

  if (!session) {
    return (
      <main className="wrap narrow">
        <h1>Workspace</h1>
        <p className="dim-t">Sign in or start a demo to open your workspace.</p>
        <div className="row"><button className="btn" onClick={() => go("auth")}>Sign in</button><button className="btn ghost" onClick={startDemo}>24h demo</button></div>
      </main>
    );
  }
  const usable = session.demo ? AGENTS.slice(0, 3).map((a) => a.id) : purchases;
  const setR = (id, patch) => setRunning((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const setP = (id, patch) => setPRun((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const setB = (k) => (e) => { setBizDraft((b) => ({ ...b, [k]: e.target.value })); setBizSaved(false); };

  async function saveAsPipeline(agentId) {
    const st = running[agentId] || {};
    const name = (st.pipeName || "").trim();
    if (!name || !st.steps?.length) return;
    const r = await store.savePipeline(session, name, st.steps.map((s) => s.agent.id));
    if (r.pipeline) {
      setPipes((p) => [r.pipeline, ...p]);
      setR(agentId, { pipeName: "", pipeSaved: true });
      setTimeout(() => setR(agentId, { pipeSaved: false }), 2500);
    }
  }

  async function deletePipe(id) {
    await store.deletePipeline(session, id);
    setPipes((p) => p.filter((x) => x.id !== id));
  }

  // Run a saved/curated pipeline: agent 1 gets the input, each next agent gets a handoff.
  async function runPipeline(p) {
    const st = pRun[p.id] || {};
    if (!st.input?.trim() || st.live) return;
    const agents = p.agentIds.map(getAgent).filter(Boolean);
    if (!agents.length) return;
    setP(p.id, { steps: [], err: null, live: { phase: "drafting", text: "", agent: agents[0] } });
    const steps = [];
    try {
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        const input = i === 0 ? st.input : handoffInput(agents[i - 1], agent, st.input, steps[i - 1].text);
        setP(p.id, { live: { phase: "drafting", text: "", agent } });
        const r = await runAgentTaskFor(session, agent, input, bizDraft, (u) => setP(p.id, { live: { ...u, agent } }));
        store.logEvent("run", session);
        steps.push({ agent, ...r });
        setP(p.id, { steps: [...steps] });
      }
      setP(p.id, { live: null });
    } catch (e) { setP(p.id, { err: e.message, live: null }); }
  }

  // Put a pipeline on a schedule: snapshot the agent chain so the cron worker
  // can run it server-side without the client bundle.
  async function scheduleLoop(p) {
    const st = pRun[p.id] || {};
    if (!st.input?.trim()) { setP(p.id, { err: "Write the task first — that's what the loop will run on schedule." }); return; }
    const agents = p.agentIds.map(getAgent).filter(Boolean).slice(0, 3)
      .map((a) => ({ id: a.id, name: a.name, system: a.system, tier: a.tier || "standard" }));
    const loopInput = (LANG === "ar" ? "(اكتب الناتج بالكامل باللغة العربية) " : "") + st.input.trim();
    const r = await store.createLoop(session, {
      name: p.name, agents, input: loopInput, cadence: st.cadence === "weekly" ? "weekly" : "daily",
    });
    if (r.error) { setP(p.id, { err: r.error }); return; }
    setLoops((l) => [r.loop, ...l]);
    setP(p.id, { err: null, scheduled: true });
    setTimeout(() => setP(p.id, { scheduled: false }), 3000);
  }

  function fbAgent(agentId) {
    return (i, verdict) => {
      const st = running[agentId] || {};
      const s = st.steps?.[i];
      if (!s) return;
      store.saveFeedback(session, { agentId: s.agent.id, verdict, text: s.text, task: st.input });
      setR(agentId, { steps: st.steps.map((x, idx) => (idx === i ? { ...x, fb: verdict } : x)) });
    };
  }

  function fbPipe(pid) {
    return (i, verdict) => {
      const st = pRun[pid] || {};
      const s = st.steps?.[i];
      if (!s) return;
      store.saveFeedback(session, { agentId: s.agent.id, verdict, text: s.text, task: st.input });
      setP(pid, { steps: st.steps.map((x, idx) => (idx === i ? { ...x, fb: verdict } : x)) });
    };
  }

  function fbRun(run) {
    return (i, verdict) => {
      const s = (run.steps || [])[i];
      if (!s) return;
      const loop = loops.find((l) => l.id === run.loop_id);
      store.saveFeedback(session, { agentId: s.id || s.name, verdict, text: s.text, task: loop?.input || "" });
      setLoopRuns((rs) => rs.map((r) => (r.id === run.id
        ? { ...r, steps: r.steps.map((x, idx) => (idx === i ? { ...x, fb: verdict } : x)) } : r)));
    };
  }

  async function toggleLoop(loop) {
    await store.setLoopActive(session, loop.id, !loop.active);
    setLoops((ls) => ls.map((l) => (l.id === loop.id ? { ...l, active: !loop.active } : l)));
  }

  async function removeLoop(id) {
    await store.deleteLoop(session, id);
    setLoops((ls) => ls.filter((l) => l.id !== id));
  }

  async function run(agentId) {
    const agent = getAgent(agentId);
    const st = running[agentId] || {};
    if (!st.input?.trim() || st.live) return;
    setR(agentId, { steps: [], err: null, live: { phase: "drafting", text: "", agent } });
    try {
      const r = await runAgentTaskFor(session, agent, st.input, bizDraft, (u) => setR(agentId, { live: { ...u, agent } }));
      store.logEvent("run", session);
      setR(agentId, { steps: [{ agent, ...r }], live: null });
    } catch (e) { setR(agentId, { err: e.message, live: null }); }
  }

  async function handoff(agentId, toId) {
    const st = running[agentId] || {};
    const prev = st.steps?.[st.steps.length - 1];
    const toAgent = getAgent(toId);
    if (!prev || !toAgent || st.live) return;
    setR(agentId, { err: null, live: { phase: "drafting", text: "", agent: toAgent } });
    try {
      const input = handoffInput(prev.agent, toAgent, st.input, prev.text);
      const r = await runAgentTaskFor(session, toAgent, input, bizDraft, (u) => setR(agentId, { live: { ...u, agent: toAgent } }));
      store.logEvent("run", session);
      setR(agentId, { steps: [...(st.steps || []), { agent: toAgent, ...r }], live: null });
    } catch (e) { setR(agentId, { err: e.message, live: null }); }
  }

  return (
    <main className="wrap">
      <div className="ws-head">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Ahlan, {session.name} 👋</h1>
        </div>
        {session.demo && <Tag>DEMO · {timeLeft(session.expires)}</Tag>}
      </div>

      {session.demo && (
        <div className="notice">
          You're on the 24-hour demo — you can run the first three agents below. Purchases require a free account.{" "}
          <button className="link" onClick={() => go("auth")}>Create account →</button>
        </div>
      )}

      {/* one intake, shared by every agent */}
      <section className="section-sm">
        <h2 className="sub">Business profile</h2>
        <p className="dim-t">Fill this once — every agent reads it automatically, so you never re-explain your business.</p>
        <div className="biz-grid">
          <div><label>Product / service</label><input value={bizDraft.product} onChange={setB("product")} placeholder="Premium Lebanese olive oil, D2C + restaurants" /></div>
          <div><label>Primary market</label><input value={bizDraft.market} onChange={setB("market")} placeholder="Beirut → GCC corridor" /></div>
          <div><label>Tone & language</label><input value={bizDraft.tone} onChange={setB("tone")} placeholder="Warm, Levantine Arabic + English" /></div>
          <div><label>Goals</label><input value={bizDraft.goals} onChange={setB("goals")} placeholder="$20k/mo in 6 months, first GCC channel" /></div>
        </div>
        <button className="btn small" style={{ marginTop: 12 }} onClick={async () => { await saveBiz(bizDraft); setBizSaved(true); }}>
          {bizSaved ? "Saved ✓" : "Save profile"}
        </button>
        {session.demo && <span className="dim-t small-t" style={{ marginLeft: 12 }}>Demo profiles aren't persisted — create an account to keep yours.</span>}
      </section>

      <section className="section-sm">
        <h2 className="sub">My agents</h2>
        {usable.length === 0 && <p className="dim-t">No agents yet. <button className="link" onClick={() => go("directory")}>Browse the hive →</button></p>}
        {usable.map((id) => {
          const a = getAgent(id);
          if (!a) return null;
          const st = running[id] || {};
          return (
            <div key={id} className="ws-agent">
              <div className="row spread">
                <div><strong>{a.name}</strong><span className="dim-t"> · {a.layerName}</span></div>
                <button className="link" onClick={() => go("agent", id)}>Agent page →</button>
              </div>
              <textarea rows={2} value={st.input || ""} onChange={(e) => setR(id, { input: e.target.value })}
                placeholder="What should this agent work on? Your business profile is attached automatically…" />
              <div className="row">
                <button className="btn small" onClick={() => run(id)} disabled={!!st.live || !st.input?.trim()}>
                  {st.live ? "Running…" : (st.steps?.length ? "Run again" : "Run")}
                </button>
                {st.err && <span className="err">{st.err}</span>}
              </div>
              <ChainView steps={st.steps || []} live={st.live || null} onFeedback={fbAgent(id)} />
              {(st.steps?.length || 0) > 0 && !st.live && (
                <HandoffBar
                  currentId={st.steps[st.steps.length - 1].agent.id}
                  options={usable.map(getAgent).filter(Boolean)}
                  onHandoff={(to) => handoff(id, to)}
                  busy={false}
                />
              )}
              {(st.steps?.length || 0) >= 2 && !st.live && (
                <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
                  <input
                    value={st.pipeName || ""}
                    onChange={(e) => setR(id, { pipeName: e.target.value })}
                    placeholder={`Save this ${st.steps.length}-agent chain as a pipeline…`}
                    style={{ maxWidth: 300 }}
                  />
                  <button className="btn small ghost" disabled={!(st.pipeName || "").trim()} onClick={() => saveAsPipeline(id)}>
                    {t("Save pipeline", "احفظ الخط")}
                  </button>
                  {st.pipeSaved && <span className="dim-t small-t">Saved ✓ — find it under Pipelines</span>}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="section-sm">
        <h2 className="sub">{t("Pipelines", "خطوط الوكلاء")}</h2>
        <p className="dim-t">
          Reusable agent chains — one input runs every agent in sequence, each building on the last.
          Save your own from any multi-agent chain above, or run a curated one.{" "}
          <button className="link" onClick={() => go("pipelines")}>How pipelines work →</button>
        </p>
        {[...pipes, ...CURATED_PIPELINES].map((p) => {
          const agents = p.agentIds.map(getAgent).filter(Boolean);
          const missing = agents.filter((a) => !usable.includes(a.id));
          const locked = missing.length > 0;
          const st = pRun[p.id] || {};
          return (
            <div key={p.id} className="ws-agent" style={locked ? { opacity: 0.75 } : undefined}>
              <div className="row spread">
                <div>
                  <strong>{p.name}</strong>
                  <span className="dim-t"> · {agents.map((a) => a.name).join(" → ")}</span>
                  {p.curated && <span className="tag" style={{ marginLeft: 8 }}>CURATED</span>}
                </div>
                {!p.curated && (
                  <button className="link dim" onClick={() => deletePipe(p.id)}>Delete</button>
                )}
              </div>
              {p.desc && <p className="dim-t" style={{ margin: "4px 0 0" }}>{p.desc}</p>}
              {locked ? (
                <div className="row" style={{ marginTop: 8 }}>
                  <span className="dim-t small-t">Includes agents you don't have yet: {missing.map((a) => a.name).join(", ")}.</span>
                  <button className="btn small ghost" onClick={() => go("directory")}>Browse the directory →</button>
                </div>
              ) : (
                <>
                  <textarea rows={2} value={st.input || ""} onChange={(e) => setP(p.id, { input: e.target.value })}
                    placeholder="One task for the whole chain — your business profile is attached automatically…" />
                  <div className="row">
                    <button className="btn small" onClick={() => runPipeline(p)} disabled={!!st.live || !st.input?.trim()}>
                      {st.live ? `Running ${st.live.agent.name}…` : (st.steps?.length ? "Run again" : `Run pipeline (${agents.length} agents)`)}
                    </button>
                    {store.loopsAvailable(session) ? (
                      <>
                        <select value={st.cadence || "daily"} onChange={(e) => setP(p.id, { cadence: e.target.value })}
                          style={{ padding: "6px 8px" }} aria-label="Loop cadence">
                          <option value="daily">{t("every day", "كل يوم")}</option>
                          <option value="weekly">{t("every week", "كل أسبوع")}</option>
                        </select>
                        <button className="btn small ghost" onClick={() => scheduleLoop(p)} disabled={!!st.live}>
                          {t("⟳ Run on a schedule", "⟳ شغّل بجدول زمني")}
                        </button>
                        {st.scheduled && <span className="dim-t small-t">Loop created ✓ — see Active loops below</span>}
                      </>
                    ) : (
                      session.demo && <span className="dim-t small-t">⟳ Scheduled loops need a full (free) account.</span>
                    )}
                    {st.err && <span className="err">{st.err}</span>}
                  </div>
                  <ChainView steps={st.steps || []} live={st.live || null} onFeedback={fbPipe(p.id)} />
                </>
              )}
            </div>
          );
        })}
      </section>

      {store.loopsAvailable(session) && (
        <section className="section-sm">
          <h2 className="sub">{t("Active loops", "الحلقات النشطة")}</h2>
          <p className="dim-t">
            Pipelines on a schedule — they run on zhive's servers even when you're offline, and every result
            lands here (and in your inbox, once email delivery is configured). This is loop engineering, live.
          </p>
          {loops.length === 0 ? (
            <p className="dim-t">No loops yet. Write a task in any pipeline above and press "⟳ Run on a schedule".</p>
          ) : loops.map((l) => (
            <div key={l.id} className="ws-agent" style={l.active ? undefined : { opacity: 0.6 }}>
              <div className="row spread">
                <div>
                  <strong>{l.name}</strong>
                  <span className="dim-t"> · {l.cadence} · {(l.agents || []).map((a) => a.name).join(" → ")}</span>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <span className="tag">{l.active ? "ACTIVE" : "PAUSED"}</span>
                  <button className="link" onClick={() => toggleLoop(l)}>{l.active ? t("Pause", "إيقاف مؤقت") : t("Resume", "استئناف")}</button>
                  <button className="link dim" onClick={() => removeLoop(l.id)}>{t("Delete", "حذف")}</button>
                </div>
              </div>
              <p className="dim-t" style={{ margin: "4px 0 0" }}>
                Task: "{l.input}"{l.last_run ? ` · last ran ${new Date(l.last_run).toLocaleString()}` : " · hasn't run yet — next daily tick is 06:00 UTC"}
              </p>
            </div>
          ))}

          {loopRuns.length > 0 && (
            <>
              <h3 style={{ marginTop: 22 }}>Recent loop runs</h3>
              {loopRuns.map((r) => {
                const loopName = loops.find((l) => l.id === r.loop_id)?.name || "Loop";
                const open = openRun === r.id;
                return (
                  <div key={r.id} className="ws-agent">
                    <div className="row spread">
                      <div>
                        <strong>{loopName}</strong>
                        <span className="dim-t"> · {new Date(r.created_at).toLocaleString()} · {(r.steps || []).length} step{(r.steps || []).length > 1 ? "s" : ""}</span>
                        {r.status !== "ok" && <span className="err" style={{ marginLeft: 8 }}>failed</span>}
                      </div>
                      <button className="link" onClick={() => setOpenRun(open ? null : r.id)}>{open ? t("Hide", "إخفاء") : t("View digest", "عرض الملخص")}</button>
                    </div>
                    {open && (
                      <ChainView
                        steps={(r.steps || []).map((s) => ({ agent: { name: s.name, id: s.id || s.name }, text: s.text, qa: s.qa, fb: s.fb }))}
                        live={null}
                        onFeedback={fbRun(r)}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </section>
      )}

      <section className="section-sm">
        <h2 className="sub">Purchases</h2>
        {myOrders.length === 0 && <p className="dim-t">No orders yet.</p>}
        {myOrders.map((o) => (
          <div key={o.id} className="cart-row">
            <div><strong>{o.id}</strong><span className="dim-t"> · {new Date(o.date).toLocaleDateString()}</span><br /><span className="dim-t">{Array.isArray(o.items) ? o.items.join(", ") : ""}</span></div>
            <span>${o.total}/mo</span>
          </div>
        ))}
        <button className="btn ghost small" onClick={() => go("directory")} style={{ marginTop: 10 }}>Add more agents</button>
      </section>
    </main>
  );
}

// ════════ ADMIN ════════
function Admin() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null); // {users, orders}
  const [tab, setTab] = useState("registrations");

  async function enter() {
    if (busy) return;
    setBusy(true); setErr(null);
    const r = await store.adminFetch(pw);
    if (r.error) setErr(r.error);
    else setData(r);
    setBusy(false);
  }

  if (!data) {
    return (
      <main className="wrap narrow">
        <p className="eyebrow">/admin</p>
        <h1>Admin access</h1>
        <label>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enter()} placeholder="••••••••" />
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ marginTop: 14 }} onClick={enter} disabled={busy}>{busy ? "…" : "Enter"}</button>
        {!isCloud && <p className="dim-t small-t">Prototype password: zhive2026 · In production, set ADMIN_PASSWORD in Vercel.</p>}
      </main>
    );
  }

  const { users, orders } = data;
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <main className="wrap">
      <p className="eyebrow">/admin {isCloud ? "· live data" : "· prototype data"}</p>
      <h1>Hive control</h1>
      <div className="row tabs">
        {["registrations", "finances", "orders", "metrics"].map((t) => (
          <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "registrations" && (
        <section>
          <div className="stat-row">
            <div className="stat"><span className="stat-n">{users.length}</span><span className="dim-t">accounts</span></div>
            <div className="stat"><span className="stat-n">{users.filter((u) => u.purchases > 0).length}</span><span className="dim-t">paying</span></div>
          </div>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Agents</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email}>
                  <td>{u.name}</td><td>{u.email}</td>
                  <td>{new Date(u.created).toLocaleDateString()}</td>
                  <td>{u.purchases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "finances" && (
        <section>
          <div className="stat-row">
            <div className="stat"><span className="stat-n">${revenue}</span><span className="dim-t">MRR booked</span></div>
            <div className="stat"><span className="stat-n">{orders.length}</span><span className="dim-t">orders</span></div>
            <div className="stat"><span className="stat-n">${orders.length ? Math.round(revenue / orders.length) : 0}</span><span className="dim-t">avg order</span></div>
          </div>
          <p className="dim-t">Orders are recorded without payment processing{isCloud ? "" : " — sample data shown in prototype mode"}.</p>
        </section>
      )}

      {tab === "metrics" && data.metrics && (
        <section>
          <div className="stat-row">
            <div className="stat"><span className="stat-n">{data.metrics.activationPct}%</span><span className="dim-t">activation (ran ≥1 agent)</span></div>
            <div className="stat"><span className="stat-n">{data.metrics.runsPerAccount}</span><span className="dim-t">runs / account</span></div>
            <div className="stat"><span className="stat-n">{data.metrics.payingPct}%</span><span className="dim-t">accounts paying</span></div>
            <div className="stat"><span className="stat-n">{data.metrics.demos}</span><span className="dim-t">demo sessions</span></div>
            <div className="stat"><span className="stat-n">{data.metrics.runs}</span><span className="dim-t">total agent runs</span></div>
          </div>
          <p className="dim-t">The three numbers to optimize, in order: activation → runs per account → paying %. Nothing else matters until these move.</p>
        </section>
      )}

      {tab === "orders" && (
        <table className="tbl">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id + o.email}>
                <td>{o.id}{o.sample ? " (sample)" : ""}</td><td>{o.email}</td>
                <td>{Array.isArray(o.items) ? o.items.join(", ") : ""}</td><td>${o.total}/mo</td>
                <td>{new Date(o.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

// ════════ STYLES ════════
const CSS = `
/* ——— RTL / Arabic mode ——— */
html[dir="rtl"] body, html[dir="rtl"] input, html[dir="rtl"] textarea, html[dir="rtl"] select, html[dir="rtl"] button { font-family: system-ui, "Segoe UI", Tahoma, Arial, sans-serif; }
html[dir="rtl"] .eyebrow, html[dir="rtl"] .strip-n, html[dir="rtl"] .tag, html[dir="rtl"] .foot { letter-spacing: 0; }
html[dir="rtl"] h1, html[dir="rtl"] h2, html[dir="rtl"] h3 { letter-spacing: 0; }

.art-code { background:#131519; color:#B7BDC6; padding:14px 16px; border-radius:8px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; line-height:1.65; overflow-x:auto; white-space:pre; margin:16px 0; }

:root {
  --ink: #0B0B0B;
  --dim: #6E6E6E;
  --line: #E4E4E4;
  --bg: #FFFFFF;
  --display: "Futura", "Avenir Next", "Century Gothic", "Trebuchet MS", sans-serif;
  --body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, monospace;
}
* { box-sizing: border-box; }
.app { min-height: 100vh; background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 15px; line-height: 1.6; }
.wrap { max-width: 960px; margin: 0 auto; padding: 40px 24px 90px; }
.wrap.narrow { max-width: 520px; }
h1 { font-family: var(--display); font-weight: 500; font-size: clamp(26px, 4.5vw, 40px); line-height: 1.15; margin: 0 0 12px; letter-spacing: 0.005em; }
h2 { font-family: var(--display); font-weight: 500; font-size: 24px; margin: 0 0 10px; }
h3 { font-family: var(--display); font-weight: 600; font-size: 18px; margin: 0 0 8px; }
.sub { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink); border-bottom: 1px solid var(--ink); display: inline-block; padding-bottom: 4px; margin: 0 0 14px; }
.eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--dim); margin: 0 0 10px; }
.lede { color: var(--dim); max-width: 620px; }
.dim-t { color: var(--dim); font-size: 13.5px; }
.small-t { font-size: 12px; margin-top: 14px; }
.center { text-align: center; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.row.spread { justify-content: space-between; }
.err { color: #B3261E; font-size: 13px; }
.pulse { animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
@media (prefers-reduced-motion: reduce) { .pulse { animation: none } }

/* header / footer */
.hdr { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--ink); position: sticky; top: 0; background: var(--bg); z-index: 10; }
.brand { display: flex; align-items: center; gap: 10px; background: none; border: none; padding: 0; cursor: pointer; }
.brand-name { font-family: var(--display); letter-spacing: 0.22em; font-size: 13px; color: var(--ink); }
.hex { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; clip-path: polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%); border: 1.5px solid var(--ink); box-shadow: inset 0 0 0 1.5px var(--ink); font-family: var(--mono); font-size: 13px; }
.nav { display: flex; gap: 18px; align-items: center; }
.foot { display: flex; justify-content: space-between; gap: 14px; padding: 18px 24px; border-top: 1px solid var(--line); font-size: 12px; color: var(--dim); flex-wrap: wrap; }

/* buttons */
button { cursor: pointer; font-family: var(--body); }
button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.btn { background: var(--ink); color: var(--bg); border: 1px solid var(--ink); padding: 12px 22px; font-size: 14px; font-weight: 600; border-radius: 0; }
.btn:disabled { opacity: 0.35; cursor: default; }
.btn.ghost { background: var(--bg); color: var(--ink); }
.btn.small { padding: 8px 16px; font-size: 13px; }
.link { background: none; border: none; padding: 0; color: var(--ink); text-decoration: underline; text-underline-offset: 3px; font-size: 14px; }
.link.dim { color: var(--dim); }

/* hero + sections */
.hero { padding: 6vh 0 20px; }
.section { margin-top: 60px; }
.section-sm { margin-top: 44px; }

/* horizontal accordion — the signature */
.hacc { display: flex; border: 1px solid var(--ink); height: var(--hacc-h); margin-top: 18px; }
.hacc-panel { border-right: 1px solid var(--ink); display: flex; overflow: hidden; cursor: pointer; flex: 0 0 56px; transition: flex 0.35s ease; background: var(--bg); }
.hacc-panel:last-child { border-right: none; }
.hacc-panel.active { flex: 1 1 auto; cursor: default; }
.hacc-strip { width: 56px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 14px 0; gap: 14px; border-right: 1px solid transparent; }
.hacc-panel.active .hacc-strip { border-right: 1px solid var(--line); }
.strip-n { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; writing-mode: vertical-rl; }
.strip-t { font-family: var(--display); font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; writing-mode: vertical-rl; color: var(--dim); }
.hacc-body { padding: 18px 22px; overflow-y: auto; animation: fade .3s ease; flex: 1; }
@keyframes fade { from { opacity: 0 } to { opacity: 1 } }
.step-icon { font-size: 20px; margin-right: 10px; }
@media (max-width: 640px) {
  .hacc { flex-direction: column; height: auto; }
  .hacc-panel { border-right: none; border-bottom: 1px solid var(--ink); flex: 0 0 48px; }
  .hacc-panel:last-child { border-bottom: none; }
  .hacc-panel.active { flex: 1 1 auto; }
  .hacc-strip { width: auto; flex-direction: row; padding: 0 14px; height: 48px; }
  .strip-n, .strip-t { writing-mode: horizontal-tb; }
}

/* chips */
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.chip { font-family: var(--mono); font-size: 11.5px; padding: 5px 11px; border: 1px solid var(--ink); background: var(--bg); color: var(--ink); }
.chip:hover { background: var(--ink); color: var(--bg); }

/* agent page */
.agent-head { display: flex; justify-content: space-between; gap: 30px; margin: 20px 0 40px; flex-wrap: wrap; }
.buy-box { border: 1px solid var(--ink); padding: 20px 22px; min-width: 240px; }
.price { font-family: var(--display); font-size: 34px; margin: 0 0 4px; }
.price span { font-size: 15px; color: var(--dim); }
.buy-box .btn { width: 100%; margin-top: 12px; }
.agent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px 50px; }
@media (max-width: 720px) { .agent-grid { grid-template-columns: 1fr; } }
.clean { padding-left: 18px; margin: 0; }
.clean li { margin: 8px 0; }
.case-title { font-family: var(--display); font-weight: 600; font-size: 16px; }
.demo-out { border: 1px solid var(--line); border-left: 3px solid var(--ink); padding: 4px 18px; margin-top: 14px; font-size: 14px; }

/* markdown */
.md h4.md-h, .md-h { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; margin: 18px 0 6px; }
.md ul { padding-left: 18px; margin: 6px 0 12px; }
.md li { margin: 4px 0; }
.md p { margin: 8px 0; }

/* forms */
label { display: block; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim); margin: 18px 0 6px; }
input, textarea, select { width: 100%; border: 1px solid var(--ink); background: var(--bg); color: var(--ink); padding: 11px 13px; font-size: 14.5px; font-family: var(--body); border-radius: 0; resize: vertical; }
::placeholder { color: #B5B5B5; }
textarea { margin-bottom: 10px; }

/* cart */
.cart-row { display: flex; justify-content: space-between; align-items: center; gap: 14px; border-bottom: 1px solid var(--line); padding: 14px 0; }
.cart-row.total { border-bottom: 1px solid var(--ink); margin-bottom: 16px; }
.wrap .btn { margin-top: 6px; }

/* auth */
.demo-cta { border: 1px solid var(--ink); padding: 18px 20px; margin-top: 34px; }
.demo-cta .btn { margin-top: 10px; }

/* workspace */
.ws-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.tag { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; border: 1px solid var(--ink); padding: 6px 10px; }
.notice { border: 1px solid var(--ink); padding: 14px 18px; margin-top: 18px; font-size: 14px; }
.ws-agent { border: 1px solid var(--line); padding: 18px 20px; margin-bottom: 14px; }
.ws-agent textarea { margin-top: 12px; }

/* directory */
.dir-controls { margin: 26px 0 22px; display: flex; flex-direction: column; gap: 14px; }
.dir-controls input { max-width: 420px; }
.chip-on { background: var(--ink); color: var(--bg); }
.dir-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.dir-card { border: 1px solid var(--ink); padding: 18px 20px; display: flex; flex-direction: column; }

/* about infographic */
.ig-band { display: flex; border: 1px solid var(--ink); margin-top: 30px; flex-wrap: wrap; }
.ig-stat { flex: 1 1 140px; padding: 20px 22px; border-right: 1px solid var(--ink); display: flex; flex-direction: column; gap: 2px; }
.ig-stat:last-child { border-right: none; }
.ig-n { font-family: var(--display); font-size: 34px; line-height: 1; }
.ig-roles { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0; border: 1px solid var(--ink); margin-top: 22px; }
.ig-role { display: flex; gap: 12px; align-items: flex-start; padding: 16px 18px; border: 0 solid var(--line); border-right-width: 1px; border-bottom-width: 1px; }
.ig-role-n { font-family: var(--mono); font-size: 10.5px; color: var(--dim); padding-top: 3px; }
.ig-role-icon { font-size: 18px; }
.ig-mantras { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
.ig-mantra { font-family: var(--display); font-size: 14px; border: 1px solid var(--ink); padding: 8px 14px; }
.ig-layers { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 12px; margin-top: 22px; }
.ig-layer { display: flex; gap: 12px; align-items: flex-start; border: 1px solid var(--ink); padding: 14px 16px; }
.ig-report { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.ig-check { font-family: var(--mono); font-size: 12.5px; border: 1px solid var(--ink); padding: 7px 12px; }

/* knowledge + article */
.kn-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-top: 26px; }
.kn-card { border: 1px solid var(--ink); padding: 20px 22px; cursor: pointer; display: flex; flex-direction: column; gap: 8px; }
.kn-card:hover h3 { text-decoration: underline; text-underline-offset: 3px; }
.kn-soon { border-color: var(--line); cursor: default; }
.kn-soon:hover h3 { text-decoration: none; }
.article { max-width: 720px; }
.article p { margin: 12px 0; }
.pull { border-left: 3px solid var(--ink); margin: 26px 0; padding: 4px 20px; font-family: var(--display); font-size: 19px; line-height: 1.5; }
.loop-flow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; border: 1px solid var(--ink); padding: 18px 20px; margin: 20px 0; }
.loop-stage { display: flex; align-items: center; gap: 8px; font-family: var(--display); font-size: 14px; letter-spacing: 0.04em; }
.loop-arrow { font-size: 16px; color: var(--dim); }
.loop-anatomy { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--ink); margin-top: 18px; }
.loop-layer { display: flex; gap: 14px; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.loop-layer:last-child { border-bottom: none; }
.loop-cases { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
@media (max-width: 640px) { .loop-cases { grid-template-columns: 1fr; } }

/* business profile grid */
.biz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; margin-top: 6px; }
@media (max-width: 640px) { .biz-grid { grid-template-columns: 1fr; } }

/* vs comparison + featured card */
.vs { border: 1px solid var(--ink); margin: 18px 0; }
.vs-head { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--ink); }
.vs-head span { font-family: var(--display); font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; padding: 12px 16px; }
.vs-head span:first-child { border-right: 1px solid var(--ink); color: var(--dim); }
.vs-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--line); }
.vs-row:last-child { border-bottom: none; }
.vs-row span { padding: 10px 16px; font-size: 14px; }
.vs-row span:first-child { border-right: 1px solid var(--line); color: var(--dim); }
.kn-feature { border: 1px solid var(--ink); border-left: 4px solid var(--ink); padding: 26px 28px; margin-top: 26px; cursor: pointer; display: flex; flex-direction: column; gap: 6px; }
.kn-feature:hover h2 { text-decoration: underline; text-underline-offset: 3px; }

/* admin */
.tabs { margin: 18px 0 26px; }
.tab { background: none; border: 1px solid var(--ink); padding: 8px 16px; font-family: var(--mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink); }
.tab.on { background: var(--ink); color: var(--bg); }
.stat-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 24px; }
.stat { border: 1px solid var(--ink); padding: 16px 22px; min-width: 130px; }
.stat-n { display: block; font-family: var(--display); font-size: 28px; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.tbl th { text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim); border-bottom: 1px solid var(--ink); padding: 8px 10px 8px 0; }
.tbl td { border-bottom: 1px solid var(--line); padding: 10px 10px 10px 0; }
`;
