// Sends today's stories to all subscribers via Resend (free: 100 emails/day)
// Requires RESEND_API_KEY env var — sign up free at resend.com

const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';

export default async function handler(req, res) {
  try {
    const sbKey = process.env.SUPABASE_SERVICE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!sbKey) return res.status(401).json({ error: 'SUPABASE_SERVICE_KEY not set' });
    if (!resendKey) return res.status(401).json({ error: 'RESEND_API_KEY not set — sign up free at resend.com' });

    // Get today's stories
    const sr = await fetch(`${SUPABASE_URL}/rest/v1/news_stories?select=*&order=id.asc`, {
      headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` },
    });
    const stories = sr.ok ? await sr.json() : [];
    if (!stories.length) return res.status(200).json({ ok: false, reason: 'No stories to send' });

    // Get subscribers
    const ur = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers?select=email`, {
      headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` },
    });
    const subs = ur.ok ? await ur.json() : [];
    if (!subs.length) return res.status(200).json({ ok: false, reason: 'No subscribers' });

    // Build email HTML
    const storyHtml = stories.map(s => `
      <div style="border:1px solid #eee;border-radius:12px;padding:20px;margin-bottom:14px">
        <div style="font-size:11px;color:#888;margin-bottom:8px">${s.tag} · ${s.date}</div>
        <div style="font-size:17px;font-weight:700;color:#0a0a0a;margin-bottom:8px">${s.emoji} ${s.title}</div>
        <div style="font-size:14px;color:#555;line-height:1.6">${s.body}</div>
      </div>`).join('');

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:22px;font-weight:900;letter-spacing:2px">ZHIVE</div>
          <div style="font-size:12px;color:#888;margin-top:4px">☀️ Your morning AI briefing · ${stories[0]?.date || ''}</div>
        </div>
        ${storyHtml}
        <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #eee">
          <a href="https://zhive-psi.vercel.app" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">Open ZHIVE →</a>
          <div style="font-size:11px;color:#bbb;margin-top:16px">© 2026 ZHIVE · Built in Beirut 🇱🇧</div>
        </div>
      </div>`;

    // Send via Resend (batch)
    let sent = 0;
    for (const sub of subs) {
      const er = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'ZHIVE Daily <onboarding@resend.dev>',
          to: sub.email,
          subject: `☀️ AI Morning Brief — ${stories[0]?.title || 'Today in AI'}`,
          html: emailHtml,
        }),
      });
      if (er.ok) sent++;
    }

    return res.status(200).json({ ok: true, sent, total: subs.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
