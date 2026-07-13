import { useState, useEffect, useRef } from 'react';

// Fallback stories shown until the live feed loads (or if it's empty)
const FALLBACK = [
  { tag: 'Model release', date: 'Jul 13, 2026', emoji: '🚀', title: 'Fresh AI stories load every morning at 6 AM', body: 'This section updates itself daily — Claude searches the web for the most important agentic AI news and writes the briefing automatically.', read: '1 min read' },
];

export default function HappeningNow() {
  const [stories, setStories] = useState(FALLBACK);
  const [email, setEmail] = useState('');
  const [subMsg, setSubMsg] = useState('');
  const trackRef = useRef(null);

  useEffect(() => {
    fetch('/api/get-news')
      .then(r => r.json())
      .then(d => { if (d.stories?.length) setStories(d.stories); })
      .catch(() => {});
  }, []);

  const scroll = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 330, behavior: 'smooth' });
  };

  const subscribe = async () => {
    if (!email.includes('@')) { setSubMsg('Enter a valid email'); return; }
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setSubMsg(d.ok ? '☀️ Subscribed — first brief arrives tomorrow morning' : (d.error || 'Try again'));
      if (d.ok) setEmail('');
    } catch {
      setSubMsg('Could not subscribe, try again');
    }
  };

  const s = {
    band: { borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '36px 0', background: '#fff', fontFamily: 'inherit' },
    head: { padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    live: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0a0a0a' },
    dot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'zhivePulse 1.5s infinite' },
    sub: { fontSize: 12, color: '#999', fontWeight: 400, letterSpacing: 0, textTransform: 'none' },
    arrows: { display: 'flex', gap: 8 },
    arr: { width: 34, height: 34, borderRadius: '50%', background: '#fff', border: '1px solid rgba(0,0,0,0.14)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    track: { display: 'flex', gap: 14, padding: '2px 40px 10px', overflowX: 'auto', scrollbarWidth: 'none' },
    card: { flexShrink: 0, width: 300, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' },
    cardTop: { height: 3, background: '#0a0a0a' },
    cardBody: { padding: 18, display: 'flex', flexDirection: 'column', flex: 1 },
    meta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    tag: { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(0,0,0,0.12)', color: '#555' },
    date: { fontSize: 11, color: '#aaa' },
    emoji: { fontSize: 26, marginBottom: 10 },
    title: { fontSize: 14, fontWeight: 700, lineHeight: 1.35, marginBottom: 8, color: '#0a0a0a' },
    body: { fontSize: 12, color: '#666', lineHeight: 1.65, flex: 1 },
    foot: { display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)', fontSize: 11, color: '#aaa' },
    nlWrap: { padding: '22px 40px 0', display: 'flex', justifyContent: 'center' },
    nlBox: { display: 'flex', gap: 8, alignItems: 'center', background: '#f8f8f8', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 99, padding: '6px 6px 6px 20px', maxWidth: 480, width: '100%' },
    nlLabel: { fontSize: 13, color: '#555', whiteSpace: 'nowrap' },
    nlInput: { flex: 1, border: 'none', background: 'none', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0a0a0a', minWidth: 0 },
    nlBtn: { background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, padding: '8px 18px', borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
    nlMsg: { textAlign: 'center', fontSize: 12, color: '#555', marginTop: 10 },
  };

  return (
    <div style={s.band}>
      <style>{'@keyframes zhivePulse{0%,100%{opacity:1}50%{opacity:0.3}}'}</style>
      <div style={s.head}>
        <div style={s.live}>
          <span style={s.dot}></span>
          Happening now <span style={s.sub}>· AI agentic news, updated daily at 6 AM</span>
        </div>
        <div style={s.arrows}>
          <button style={s.arr} onClick={() => scroll(-1)}>‹</button>
          <button style={s.arr} onClick={() => scroll(1)}>›</button>
        </div>
      </div>

      <div style={s.track} ref={trackRef}>
        {stories.map((n, i) => (
          <div key={i} style={s.card}>
            <div style={s.cardTop}></div>
            <div style={s.cardBody}>
              <div style={s.meta}>
                <span style={s.tag}>{n.tag}</span>
                <span style={s.date}>{n.date}</span>
              </div>
              <div style={s.emoji}>{n.emoji}</div>
              <div style={s.title}>{n.title}</div>
              <div style={s.body}>{n.body}</div>
              <div style={s.foot}>
                <span>{n.read}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.nlWrap}>
        <div style={s.nlBox}>
          <span style={s.nlLabel}>☀️ Get this daily:</span>
          <input
            style={s.nlInput}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && subscribe()}
          />
          <button style={s.nlBtn} onClick={subscribe}>Subscribe free</button>
        </div>
      </div>
      {subMsg && <div style={s.nlMsg}>{subMsg}</div>}
    </div>
  );
}
