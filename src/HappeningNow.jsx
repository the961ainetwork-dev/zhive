import { useState, useEffect, useRef } from 'react';

const FALLBACK = [
  { tag: 'Daily brief', date: 'Every morning', emoji: '☀️', title: 'Fresh AI stories load every morning at 6 AM', body: 'This section updates itself daily — Claude searches the web for the most important agentic AI news and writes the briefing automatically.', article: '', read: '1 min read' },
];

export default function HappeningNow({ onCTA }) {
  const [stories, setStories] = useState(FALLBACK);
  const [email, setEmail] = useState('');
  const [subMsg, setSubMsg] = useState('');
  const [open, setOpen] = useState(null); // story object or null
  const [ar, setAr] = useState(null);
  const [translating, setTranslating] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    fetch('/api/get-news')
      .then(r => r.json())
      .then(d => {
        if (d.stories?.length) {
          setStories(d.stories);
          const sid = new URLSearchParams(window.location.search).get('story');
          if (sid) {
            const match = d.stories.find(s => String(s.id) === sid);
            if (match) { setAr(null); setOpen(match); }
          }
        }
      })
      .catch(() => {});
  }, []);

  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 330, behavior: 'smooth' });

  const subscribe = async () => {
    if (!email.includes('@')) { setSubMsg('Enter a valid email'); return; }
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setSubMsg(d.ok ? '☀️ Subscribed — first brief arrives tomorrow morning' : (d.error || 'Try again'));
      if (d.ok) setEmail('');
    } catch { setSubMsg('Could not subscribe, try again'); }
  };

  const waShare = (n) => {
    const text = `\uD83D\uDD14 This is a Market Alert and News Update from zhive.xyz\nThe AI Workforce: Agents That Actually Do The Work\n\n${n.emoji} ${n.title}\n\n${n.body}${n.source ? '\n\nSource: ' + n.source : ''}\n\nRead the full story:\n${n.id ? 'https://www.zhive.xyz/?story=' + n.id : 'https://www.zhive.xyz'}\n\nJoin the zhive.xyz WhatsApp group:\nhttps://chat.whatsapp.com/KcE0dmp9drGGE5VmFv0tJZ\n\nJoin the AlKhawarizmi Community WhatsApp group:\nhttps://chat.whatsapp.com/KdqHl2Rj60pGUgvAV2TM20\n\nFollow us on LinkedIn:\nhttps://www.linkedin.com/groups/10064575/`;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  const pdfExport = (n) => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${n.title}</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:640px;margin:40px auto;padding:0 24px;color:#0a0a0a;line-height:1.7}
        .brand{font-size:20px;font-weight:900;letter-spacing:2px;margin-bottom:4px}
        .meta{font-size:12px;color:#888;margin-bottom:24px}
        h1{font-size:26px;line-height:1.25;letter-spacing:-0.5px;margin:8px 0 16px}
        p{font-size:14px;margin-bottom:14px}
        .foot{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa}
      </style></head><body>
      <div class="brand">ZHIVE</div>
      <div class="meta">${n.tag} · ${n.date} · ${n.read}${n.source ? " · Source: " + n.source : ""}</div>
      <h1>${n.emoji} ${n.title}</h1>
      ${(n.article || n.body).split('\n\n').map(p => '<p>' + p + '</p>').join('')}
      <div class="foot">© 2026 ZHIVE · zhive.xyz · AI daily brief for MENA entrepreneurs</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const translate = async (n) => {
    if (ar) { setAr(null); return; }
    setTranslating(true);
    try {
      const r = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Translate this AI news story into Modern Standard Arabic for business readers. Respond ONLY with JSON: {"title":"...","article":"..."} keeping paragraphs separated by \n\n. No markdown.\n\nTITLE: ${n.title}\n\nARTICLE:\n${n.article || n.body}`, maxTokens: 2000 }),
      });
      const d = await r.json();
      const clean = (d.text || '').replace(/```json|```/g, '').trim();
      const j = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1));
      setAr(j);
    } catch (e) { setAr(null); }
    setTranslating(false);
  };

  const cta = () => {
    if (onCTA) onCTA();
    else window.location.href = 'https://www.zhive.xyz';
  };

  const s = {
    band: { borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '36px 0', background: '#fff', fontFamily: 'inherit' },
    head: { padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    live: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0a0a0a' },
    dot: { width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'zhivePulse 1.5s infinite' },
    subLbl: { fontSize: 12, color: '#999', fontWeight: 400, letterSpacing: 0, textTransform: 'none' },
    arr: { width: 34, height: 34, borderRadius: '50%', background: '#fff', border: '1px solid rgba(0,0,0,0.14)', fontSize: 15, cursor: 'pointer' },
    track: { display: 'flex', gap: 14, padding: '2px 40px 10px', overflowX: 'auto', scrollbarWidth: 'none' },
    card: { flexShrink: 0, width: 300, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' },
    cardTop: { height: 3, background: '#0a0a0a' },
    cardBody: { padding: 18, display: 'flex', flexDirection: 'column', flex: 1 },
    meta: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
    tag: { fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(0,0,0,0.12)', color: '#555' },
    date: { fontSize: 11, color: '#aaa' },
    emoji: { fontSize: 26, marginBottom: 10 },
    title: { fontSize: 14, fontWeight: 700, lineHeight: 1.35, marginBottom: 8, color: '#0a0a0a' },
    body: { fontSize: 12, color: '#666', lineHeight: 1.65, flex: 1 },
    foot: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)' },
    readBtn: { flex: 1, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
    iconBtn: { width: 34, height: 34, borderRadius: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.14)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    // modal
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', borderRadius: 18, maxWidth: 620, width: '100%', maxHeight: '86vh', overflowY: 'auto', padding: '36px 36px 28px', position: 'relative' },
    close: { position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' },
    mMeta: { fontSize: 12, color: '#888', marginBottom: 10 },
    mTitle: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.25, marginBottom: 18, color: '#0a0a0a' },
    mPara: { fontSize: 14, color: '#444', lineHeight: 1.8, marginBottom: 14 },
    mActions: { display: 'flex', gap: 8, marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.08)', flexWrap: 'wrap' },
    mCta: { flex: 1, minWidth: 160, background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, padding: '12px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' },
    mSec: { background: '#fff', color: '#0a0a0a', border: '1px solid rgba(0,0,0,0.15)', fontSize: 13, fontWeight: 500, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' },
    nlWrap: { padding: '22px 40px 0', display: 'flex', justifyContent: 'center' },
    nlBox: { display: 'flex', gap: 8, alignItems: 'center', background: '#f8f8f8', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 99, padding: '6px 6px 6px 20px', maxWidth: 480, width: '100%' },
    nlInput: { flex: 1, border: 'none', background: 'none', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0a0a0a', minWidth: 0 },
    nlBtn: { background: '#0a0a0a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, padding: '8px 18px', borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  };

  return (
    <div style={s.band}>
      <style>{'@keyframes zhivePulse{0%,100%{opacity:1}50%{opacity:0.3}}'}</style>

      <div style={s.head}>
        <div style={s.live}>
          <span style={s.dot}></span>
          Happening now <span style={s.subLbl}>· AI agentic news, updated daily at 6 AM</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
                <span style={s.date}>{n.date}{n.source ? ' · ' + n.source : ''}</span>
              </div>
              <div style={s.emoji}>{n.emoji}</div>
              <div style={s.title}>{n.title}</div>
              <div style={s.body}>{n.body}</div>
              <div style={s.foot}>
                <button style={s.readBtn} onClick={() => { setAr(null); setOpen(n); }}>Read more →</button>
                <button style={s.iconBtn} title="Share on WhatsApp" onClick={() => waShare(n)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 016.99 2.9 9.82 9.82 0 012.9 7c0 5.45-4.45 9.87-9.9 9.87zm8.42-18.29A11.8 11.8 0 0012.04 0C5.46 0 .1 5.35.1 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.94 11.94 0 005.77 1.47h.01c6.58 0 11.94-5.35 11.94-11.92 0-3.18-1.24-6.18-3.52-8.41z"/></svg>
                </button>
                <button style={s.iconBtn} title="Download PDF" onClick={() => pdfExport(n)}>📄</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.nlWrap}>
        <div style={s.nlBox}>
          <span style={{ fontSize: 13, color: '#555', whiteSpace: 'nowrap' }}>☀️ Get this daily:</span>
          <input style={s.nlInput} type="email" placeholder="you@company.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && subscribe()} />
          <button style={s.nlBtn} onClick={subscribe}>Subscribe free</button>
        </div>
      </div>
      {subMsg && <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 10 }}>{subMsg}</div>}

      {open && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div style={s.modal}>
            <button style={s.close} onClick={() => setOpen(null)}>✕</button>
            <div style={s.mMeta}>{open.tag} · {open.date} · {open.read}{open.source ? ' · Source: ' + open.source : ''}</div>
            <h2 style={{...s.mTitle, direction: ar ? 'rtl' : 'ltr'}}>{open.emoji} {ar ? ar.title : open.title}</h2>
            {((ar ? ar.article : (open.article || open.body)) || '').split('\n\n').map((p, i) => (
              <p key={i} dir={ar ? 'rtl' : 'ltr'} style={{...s.mPara, textAlign: ar ? 'right' : 'left'}}>{p}</p>
            ))}
            <div style={s.mActions}>
              <button style={s.mCta} onClick={cta}>🚀 Start free — 24h demo</button>
              <button style={s.mSec} onClick={() => waShare(open)}>Share on WhatsApp</button>
              <button style={s.mSec} onClick={() => pdfExport(ar ? { ...open, title: ar.title, article: ar.article } : open)}>📄 Save as PDF</button>
              <button style={{...s.mSec, opacity: translating ? 0.5 : 1}} disabled={translating} onClick={() => translate(open)}>{translating ? '...' : ar ? '🌐 English' : '🌐 عربي'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
