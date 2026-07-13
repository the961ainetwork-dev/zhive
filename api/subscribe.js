const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const email = (body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

    const sbKey = process.env.SUPABASE_SERVICE_KEY;
    if (!sbKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

    const r = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
      method: 'POST',
      headers: {
        'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({ email }),
    });

    if (!r.ok && r.status !== 409) {
      return res.status(500).json({ error: 'Could not subscribe' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
