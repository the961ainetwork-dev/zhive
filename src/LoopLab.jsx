import React, { useState, useRef, useEffect } from "react";

// ════════════════════════════════════════════════════════════════
// THE LOOP ENGINEERING LAB — Competitor Price Tracker
// Embedded interactive sandbox for the Loop Engineering essay.
// Self-contained: inline styles only, no external CSS dependencies.
// Teaches: sequential iteration, per-item error handling, the
// accumulator pattern, rate limiting, and aggregate-then-notify.
// ════════════════════════════════════════════════════════════════

const INK = "#111214";
const STEEL = "#6B7280";
const LINE = "#DEDED8";
const AMBER = "#E8A013";
const GREEN = "#17805A";
const RED = "#C03434";
const PANEL = "#131519";
const PANEL_TXT = "#B7BDC6";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const PRODUCTS = [
  { id: "p1", name: "Wireless Earbuds Pro", sku: "SKU-4471", ours: 89 },
  { id: "p2", name: "Smart Water Bottle", sku: "SKU-2210", ours: 45 },
  { id: "p3", name: "Desk Lamp — Fold", sku: "SKU-8834", ours: 62 },
  { id: "p4", name: "Travel Charger 65W", sku: "SKU-1093", ours: 39 },
  { id: "p5", name: "Laptop Stand Alu", sku: "SKU-6650", ours: 54 },
];
const simPrice = (ours, mode) => (mode === "low" ? Math.round(ours * 0.82) : Math.round(ours * 1.18));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

const eyebrowS = { fontFamily: MONO, fontSize: 10, letterSpacing: 2.5, color: STEEL, textTransform: "uppercase", margin: 0 };
const boxS = { border: `1.5px solid ${INK}`, borderRadius: 8, background: "#fff", overflow: "hidden", marginTop: 16 };
const boxHeadS = { padding: "9px 14px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" };
const chip = (bg, color, border) => ({ fontFamily: MONO, fontSize: 10, padding: "4px 8px", borderRadius: 4, border: `1px solid ${border}`, background: bg, color });

function ModeToggle({ value, onChange, disabled }) {
  const opts = [
    { v: "high", label: "High", c: STEEL },
    { v: "low", label: "Low", c: GREEN },
    { v: "error", label: "Error", c: RED },
  ];
  return (
    <span style={{ display: "inline-flex", border: `1px solid ${LINE}`, borderRadius: 4, overflow: "hidden" }}>
      {opts.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} disabled={disabled}
          style={{
            fontFamily: MONO, fontSize: 10, padding: "4px 9px", border: "none",
            background: value === o.v ? o.c : "transparent",
            color: value === o.v ? "#fff" : STEEL,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled && value !== o.v ? 0.4 : 1,
          }}>
          {o.label}
        </button>
      ))}
    </span>
  );
}

function StepNode({ letter, title, desc, state }) {
  const border = state === "active" ? AMBER : state === "error" ? RED : state === "done" ? INK : LINE;
  return (
    <div style={{
      flex: 1, minWidth: 120, padding: 12, border: `1.5px solid ${border}`, borderRadius: 6,
      background: state === "active" ? "#FFF8E8" : "#fff", transition: "all .2s",
      boxShadow: state === "active" ? `0 0 0 3px ${AMBER}22` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: MONO, fontSize: 11, fontWeight: 700, width: 20, height: 20,
          display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 4,
          background: state === "active" ? AMBER : state === "error" ? RED : state === "done" ? INK : "#EDEDE8",
          color: state === "idle" ? STEEL : "#fff",
        }}>{letter}</span>
        <strong style={{ fontSize: 13 }}>{title}</strong>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 11, color: STEEL, lineHeight: 1.45 }}>{desc}</p>
    </div>
  );
}

export default function LoopLab() {
  const [modes, setModes] = useState({ p1: "high", p2: "low", p3: "high", p4: "low", p5: "high" });
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cursor, setCursor] = useState(-1);
  const [step, setStep] = useState(null);
  const [itemStates, setItemStates] = useState({});
  const [acc, setAcc] = useState([]);
  const [log, setLog] = useState([]);
  const [digest, setDigest] = useState(null);
  const [fetched, setFetched] = useState({});
  const runId = useRef(0);
  const logEnd = useRef(null);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [log]);
  const addLog = (kind, text) => setLog((l) => [...l, { kind, text, t: ts() }]);

  function reset() {
    runId.current++;
    setRunning(false); setCursor(-1); setStep(null);
    setItemStates({}); setAcc([]); setLog([]); setDigest(null); setFetched({});
  }

  async function runWorkflow() {
    const my = ++runId.current;
    const alive = () => runId.current === my;
    const d = (ms) => sleep(ms / speed);

    setRunning(true); setAcc([]); setDigest(null); setLog([]); setFetched({});
    setItemStates(Object.fromEntries(PRODUCTS.map((p) => [p.id, "queued"])));
    addLog("sys", `Workflow started — iterating ${PRODUCTS.length} items sequentially`);
    addLog("note", "Why a loop, not parallel calls? Sequential iteration respects the competitor API's rate limits.");
    const localAcc = [];

    for (let i = 0; i < PRODUCTS.length; i++) {
      if (!alive()) return;
      const p = PRODUCTS[i];
      const mode = modes[p.id];
      setCursor(i);
      setItemStates((s) => ({ ...s, [p.id]: "active" }));
      addLog("iter", `Iterator → i=${i} · ${p.sku} (${p.name})`);

      setStep("A");
      addLog("step", `A · Fetching competitor price for ${p.sku}…`);
      await d(700); if (!alive()) return;

      if (mode === "error") {
        setStep("error");
        addLog("err", `A · HTTP 503 from competitor API for ${p.sku}`);
        await d(500); if (!alive()) return;
        addLog("note", "Per-item try/catch: retrying once before skipping — one bad item must never kill the loop.");
        addLog("step", `A · Retry 1/1 for ${p.sku}…`);
        setStep("A");
        await d(700); if (!alive()) return;
        setStep("error");
        addLog("err", "A · Retry failed — item skipped, loop continues");
        setItemStates((s) => ({ ...s, [p.id]: "failed" }));
        await d(400); if (!alive()) return;
      } else {
        const price = simPrice(p.ours, mode);
        setFetched((f) => ({ ...f, [p.id]: price }));
        addLog("ok", `A · Got $${price} for ${p.sku}`);

        setStep("B");
        addLog("step", `B · Comparing: ours $${p.ours} vs competitor $${price}`);
        await d(650); if (!alive()) return;

        if (price < p.ours) {
          setStep("C");
          const entry = { sku: p.sku, name: p.name, ours: p.ours, comp: price, diff: p.ours - price };
          localAcc.push(entry);
          setAcc([...localAcc]);
          setItemStates((s) => ({ ...s, [p.id]: "added" }));
          addLog("acc", `C · Undercut by $${entry.diff} → pushed to accumulator (len=${localAcc.length})`);
          await d(650); if (!alive()) return;
        } else {
          setItemStates((s) => ({ ...s, [p.id]: "skipped" }));
          addLog("ok", "C · We're competitive — nothing accumulated, no noise sent");
          await d(450); if (!alive()) return;
        }
      }

      if (i < PRODUCTS.length - 1) {
        setStep("delay");
        addLog("note", `Rate-limiting delay triggered (400ms) before i=${i + 1}`);
        await d(400); if (!alive()) return;
      }
    }

    setCursor(-1); setStep(null);
    addLog("sys", `Loop finished — accumulator holds ${localAcc.length} item(s)`);
    addLog("note", "Aggregate-then-notify: one digest after the loop, not one ping per iteration.");
    await d(500); if (!alive()) return;
    setDigest({ items: localAcc, at: ts() });
    addLog("sys", "Digest dispatched to #pricing-alerts");
    setRunning(false);
  }

  const stateDot = { queued: LINE, active: AMBER, added: GREEN, skipped: STEEL, failed: RED };

  return (
    <div style={{ margin: "10px 0 6px" }}>
      <style>{`
        @keyframes ll-pulse { 0%,100% { opacity:1 } 50% { opacity:.45 } }
        .ll-pulse { animation: ll-pulse 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ll-pulse { animation: none } }
      `}</style>

      {/* controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <p style={eyebrowS}>Interactive lab · runs entirely in your browser</p>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ display: "inline-flex", border: `1px solid ${INK}`, borderRadius: 4, overflow: "hidden" }}>
            {[1, 2].map((s) => (
              <button key={s} onClick={() => setSpeed(s)}
                style={{ fontFamily: MONO, fontSize: 11, padding: "6px 10px", border: "none", cursor: "pointer", background: speed === s ? INK : "transparent", color: speed === s ? "#fff" : INK }}>
                {s}×
              </button>
            ))}
          </span>
          <button onClick={reset} disabled={!running && log.length === 0}
            style={{ fontFamily: MONO, fontSize: 11, padding: "7px 12px", border: `1px solid ${INK}`, borderRadius: 4, background: "transparent", cursor: "pointer", opacity: !running && log.length === 0 ? 0.4 : 1 }}>
            Reset
          </button>
          <button onClick={runWorkflow} disabled={running}
            style={{ fontWeight: 700, fontSize: 13, padding: "8px 16px", border: "none", cursor: running ? "default" : "pointer", background: running ? STEEL : INK, color: "#fff", borderRadius: 4 }}>
            {running ? "Running…" : "Run workflow →"}
          </button>
        </span>
      </div>

      {/* 1 · DATA INPUTS */}
      <section style={boxS}>
        <div style={boxHeadS}>
          <p style={eyebrowS}>1 · Data inputs — the array the loop walks</p>
          <span style={{ fontFamily: MONO, fontSize: 10, color: STEEL }}>products.length = 5</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                {["", "Product", "Ours", "Competitor (simulate)", "Fetched"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 14px", fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: STEEL, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p, i) => {
                const st = itemStates[p.id] || "queued";
                const isCur = cursor === i;
                return (
                  <tr key={p.id} style={{ borderBottom: i < 4 ? `1px solid ${LINE}` : "none", background: isCur ? "#FFF8E8" : "transparent" }}>
                    <td style={{ padding: "9px 0 9px 14px", width: 20 }}>
                      <span className={isCur ? "ll-pulse" : ""} style={{ display: "inline-block", width: 9, height: 9, borderRadius: 99, background: stateDot[st] || LINE }} />
                    </td>
                    <td style={{ padding: "9px 14px" }}>
                      <strong style={{ fontWeight: 600 }}>{p.name}</strong>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: STEEL }}> {p.sku}</span>
                    </td>
                    <td style={{ padding: "9px 14px", fontFamily: MONO }}>${p.ours}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <ModeToggle value={modes[p.id]} onChange={(v) => setModes((m) => ({ ...m, [p.id]: v }))} disabled={running} />
                    </td>
                    <td style={{ padding: "9px 14px", fontFamily: MONO, color: fetched[p.id] != null && fetched[p.id] < p.ours ? GREEN : STEEL }}>
                      {st === "failed" ? <span style={{ color: RED }}>503</span> : fetched[p.id] != null ? `$${fetched[p.id]}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2 · LOOP EXECUTION */}
      <section style={boxS}>
        <div style={boxHeadS}>
          <p style={eyebrowS}>2 · Loop execution — one item at a time</p>
          <span style={{ fontFamily: MONO, fontSize: 10, color: cursor >= 0 ? AMBER : STEEL }}>
            {cursor >= 0 ? `iteration ${cursor + 1} / ${PRODUCTS.length}` : running ? "finalizing…" : "idle"}
          </span>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 14 }}>
            {PRODUCTS.map((p, i) => {
              const st = itemStates[p.id] || "queued";
              const isCur = cursor === i;
              return (
                <span key={p.id} className={isCur ? "ll-pulse" : ""}
                  style={chip(
                    isCur ? "#FFF8E8" : st === "added" ? "#EDF7F2" : st === "failed" ? "#FBEFEF" : "#fff",
                    st === "added" ? GREEN : st === "failed" ? RED : isCur ? INK : STEEL,
                    isCur ? AMBER : stateDot[st]
                  )}>
                  {p.sku}{st === "added" ? " ✓" : st === "failed" ? " ✗" : st === "skipped" ? " —" : ""}
                </span>
              );
            })}
            <span style={{ fontFamily: MONO, fontSize: 10, color: STEEL }}>✓ accumulated · — competitive · ✗ skipped after retry</span>
          </div>

          <div style={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap" }}>
            <StepNode letter="A" title="Fetch" desc="Call the competitor API for this one item."
              state={step === "A" ? "active" : step === "error" ? "error" : cursor >= 0 && ["B", "C", "delay"].includes(step) ? "done" : "idle"} />
            <span style={{ display: "flex", alignItems: "center", padding: "0 6px", color: step && step !== "A" && step !== "error" ? INK : LINE, fontSize: 18 }}>→</span>
            <StepNode letter="B" title="Compare" desc="competitor < ours? Pure logic — no side effects."
              state={step === "B" ? "active" : cursor >= 0 && ["C", "delay"].includes(step) ? "done" : "idle"} />
            <span style={{ display: "flex", alignItems: "center", padding: "0 6px", color: ["C", "delay"].includes(step) ? INK : LINE, fontSize: 18 }}>→</span>
            <StepNode letter="C" title="Accumulate" desc="If undercut, push to the array. Don't notify yet."
              state={step === "C" ? "active" : step === "delay" ? "done" : "idle"} />
          </div>

          {step === "delay" && (
            <p className="ll-pulse" style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11, color: AMBER }}>
              ⏸ rate-limit delay · 400ms · being polite to the competitor's API
            </p>
          )}
          {step === "error" && (
            <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11, color: RED }}>
              ✗ fetch failed — handled inside the iteration, loop survives
            </p>
          )}
        </div>
      </section>

      {/* 3 · OUTPUT DIGEST */}
      <section style={boxS}>
        <div style={boxHeadS}>
          <p style={eyebrowS}>3 · Output digest — fires once, after the loop</p>
          <span style={{ fontFamily: MONO, fontSize: 10, color: STEEL }}>Slack · #pricing-alerts</span>
        </div>
        <div style={{ padding: 14 }}>
          {!digest ? (
            <div style={{ padding: "22px 14px", textAlign: "center", border: `1.5px dashed ${LINE}`, borderRadius: 6 }}>
              <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: STEEL }}>
                {running ? "Waiting for the loop to finish — no partial notifications, ever." : "Run the workflow to generate the digest."}
              </p>
            </div>
          ) : (
            <div style={{ border: `1px solid ${LINE}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, background: "#F6F5F1", borderBottom: `1px solid ${LINE}` }}>
                <span style={{ width: 26, height: 26, borderRadius: 6, background: INK, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>PT</span>
                <strong style={{ fontSize: 13 }}>PriceTracker</strong>
                <span style={{ fontFamily: MONO, fontSize: 10, background: "#E8E7E1", padding: "1px 5px", borderRadius: 3, color: STEEL }}>APP</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: STEEL }}>{digest.at}</span>
              </div>
              <div style={{ padding: "12px 16px", fontSize: 13, lineHeight: 1.6 }}>
                {digest.items.length === 0 ? (
                  <p style={{ margin: 0 }}>✅ <strong>Daily price check complete.</strong> All {PRODUCTS.length} products are competitively priced. No action needed.</p>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>🔻 <strong>Price alert — {digest.items.length} product{digest.items.length > 1 ? "s" : ""} undercut by competitors:</strong></p>
                    <div style={{ marginTop: 8, borderLeft: `3px solid ${GREEN}`, paddingLeft: 10 }}>
                      {digest.items.map((it) => (
                        <p key={it.sku} style={{ margin: "2px 0", fontFamily: MONO, fontSize: 12 }}>
                          {it.name} — ours ${it.ours} vs theirs <strong style={{ color: GREEN }}>${it.comp}</strong> (−${it.diff})
                        </p>
                      ))}
                    </div>
                    <p style={{ margin: "8px 0 0", color: STEEL, fontSize: 12 }}>
                      One digest for the whole run · {PRODUCTS.length} items scanned · generated by the accumulator pattern
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TELEMETRY */}
      <section style={{ ...boxS, background: PANEL, border: `1.5px solid ${PANEL}`, color: PANEL_TXT }}>
        <div style={{ ...boxHeadS, borderBottom: "1px solid #23262C" }}>
          <p style={{ ...eyebrowS, color: "#7C838E" }}>Telemetry / debug</p>
          <span style={{ fontFamily: MONO, fontSize: 10, color: cursor >= 0 ? AMBER : "#7C838E" }}>
            iterator {cursor >= 0 ? `active · i=${cursor}` : "idle"} · step {step === "delay" ? "rate-limit" : step || "—"}
          </span>
        </div>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #23262C", fontFamily: MONO, fontSize: 10 }}>
          <span style={{ color: "#7C838E", fontSize: 9, letterSpacing: 1 }}>ACCUMULATOR STATE · len={acc.length}</span>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", color: acc.length ? "#7FD6AE" : PANEL_TXT, margin: "4px 0 0" }}>
{acc.length === 0 ? "[]" : "[\n" + acc.map((a) => `  {sku:"${a.sku}", diff:${a.diff}}`).join(",\n") + "\n]"}
          </pre>
        </div>
        <div style={{ maxHeight: 220, overflowY: "auto", padding: "10px 14px", fontFamily: MONO, fontSize: 10.5, lineHeight: 1.7 }}>
          {log.length === 0 && <p style={{ margin: 0, color: "#7C838E" }}>› Log is empty. Set each product's competitor simulation above, then Run workflow.</p>}
          {log.map((l, i) => (
            <p key={i} style={{ margin: 0, color: l.kind === "err" ? "#F08C8C" : l.kind === "acc" ? "#7FD6AE" : l.kind === "note" ? "#E9C36A" : l.kind === "iter" ? "#9DB8F0" : l.kind === "sys" ? "#fff" : PANEL_TXT }}>
              <span style={{ color: "#565C66" }}>{l.t} </span>{l.kind === "note" ? "☰ " : "› "}{l.text}
            </p>
          ))}
          <div ref={logEnd} />
        </div>
        <div style={{ padding: "9px 14px", borderTop: "1px solid #23262C", fontSize: 10.5, fontFamily: MONO, color: "#7C838E", lineHeight: 1.6 }}>
          ☰ yellow lines = loop-engineering concepts as they happen: sequential iteration, per-item try/catch, accumulator pattern, rate limiting, aggregate-then-notify.
        </div>
      </section>
    </div>
  );
}
