// ZHIVE — Newsletter admin: manage subscribers + send custom broadcasts.
// All actions require the admin password (checked server-side).
//
// POST /api/newsletter-admin  { pass, action, ... }
//   action "list"       → { subscribers: [...] }
//   action "add"        { emails: "a@x.com, b@y.com\nc@z.com" } → adds all valid, deduped
//   action "remove"     { email }                              → removes one
//   action "broadcast"  { subject, body, buttonText?, buttonUrl?, imageUrl?, recipients? }
//        recipients omitted/empty → send to ALL subscribers; else send only to the given list
//        (body supports plain text; newlines become paragraphs)

const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';
const ADMIN_PASS = 'zhive2026';
const FROM = 'ZHIVE <news@zhive.xyz>';
const DAILY_CAP = 100; // Resend free-tier safety ceiling per run

function sb(path, opts, key) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json', ...(opts.headers || {}),
    },
  });
}

function parseEmails(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function broadcastHtml({ subject, body, buttonText, buttonUrl, imageUrl }) {
  const paras = String(body || '')
    .split(/\n{2,}/)
    .map((p) => `<p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const img = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="" style="width:100%;max-width:512px;border-radius:12px;margin:0 0 22px;display:block" />`
    : '';
  const btn = (buttonText && buttonUrl)
    ? `<div style="text-align:center;margin:26px 0 6px"><a href="${esc(buttonUrl)}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:13px 30px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">${esc(buttonText)}</a></div>`
    : '';
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:26px">
      <div style="text-align:center;margin-bottom:26px">
        <div style="font-size:22px;font-weight:900;letter-spacing:2px">ZHIVE</div>
      </div>
      ${img}
      <h1 style="font-size:22px;color:#0a0a0a;line-height:1.3;margin:0 0 18px">${esc(subject)}</h1>
      ${paras}
      ${btn}
      <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:11px;color:#bbb">
        © 2026 ZHIVE · Built in Beirut 🇱🇧 · <a href="https://www.zhive.xyz" style="color:#bbb">zhive.xyz</a>
      </div>
    </div>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!sbKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // password gate
  if (String(body.pass || '') !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });

  const action = String(body.action || '');

  try {
    // ── LIST ──
    if (action === 'list') {
      const r = await sb('newsletter_subscribers?select=email&order=email.asc', { method: 'GET' }, sbKey);
      const subs = r.ok ? await r.json() : [];
      return res.status(200).json({ subscribers: subs.map((s) => s.email) });
    }

    // ── ADD (single or bulk) ──
    if (action === 'add') {
      const emails = parseEmails(body.emails);
      if (!emails.length) return res.status(400).json({ error: 'No valid emails found' });
      // fetch existing to dedupe
      const cur = await sb('newsletter_subscribers?select=email', { method: 'GET' }, sbKey);
      const existing = new Set((cur.ok ? await cur.json() : []).map((s) => s.email.toLowerCase()));
      const toAdd = [...new Set(emails)].filter((e) => !existing.has(e));
      if (!toAdd.length) return res.status(200).json({ ok: true, added: 0, message: 'All already subscribed' });
      const ins = await sb('newsletter_subscribers', {
        method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(toAdd.map((email) => ({ email }))),
      }, sbKey);
      if (!ins.ok) return res.status(500).json({ error: 'Insert failed: ' + (await ins.text()).slice(0, 200) });
      return res.status(200).json({ ok: true, added: toAdd.length });
    }

    // ── REMOVE ──
    if (action === 'remove') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ error: 'email required' });
      const r = await sb(`newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' }, sbKey);
      if (!r.ok) return res.status(500).json({ error: 'Remove failed' });
      return res.status(200).json({ ok: true, removed: email });
    }

    // ── BROADCAST ──
    if (action === 'broadcast') {
      if (!resendKey) return res.status(400).json({ error: 'RESEND_API_KEY not set' });
      const subject = String(body.subject || '').trim();
      const text = String(body.body || '').trim();
      if (!subject) return res.status(400).json({ error: 'Subject required' });
      if (!text) return res.status(400).json({ error: 'Message body required' });

      // recipients: explicit list, or all subscribers
      let recipients = parseEmails(body.recipients);
      if (!recipients.length) {
        const r = await sb('newsletter_subscribers?select=email', { method: 'GET' }, sbKey);
        recipients = (r.ok ? await r.json() : []).map((s) => s.email);
      }
      recipients = [...new Set(recipients.map((e) => e.toLowerCase()))];
      if (!recipients.length) return res.status(400).json({ error: 'No recipients' });
      if (recipients.length > DAILY_CAP) {
        return res.status(400).json({ error: `Too many recipients (${recipients.length}). Free tier caps at ${DAILY_CAP}/day.` });
      }

      const html = broadcastHtml({
        subject, body: text,
        buttonText: body.buttonText, buttonUrl: body.buttonUrl, imageUrl: body.imageUrl,
      });

      let sent = 0; const failed = [];
      for (const to of recipients) {
        const er = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM, to, subject, html }),
        });
        if (er.ok) sent++; else failed.push(to);
      }
      return res.status(200).json({ ok: true, sent, total: recipients.length, failed });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
