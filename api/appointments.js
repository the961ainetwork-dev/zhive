// ZHIVE — Demo appointment booking
// GET  /api/appointments?taken=1            → array of taken "date time" slot keys (public, for greying out)
// GET  /api/appointments?admin=PASSWORD     → full appointment list (admin only)
// POST /api/appointments  { date, time, name, email, company, note }
//        → books a slot; rejects if that date+time is already taken (409)
//
// Slot rules enforced server-side: weekdays only, time in 12:00–16:30 (30-min steps),
// date within the next 31 days. The client mirrors these, but the server is the source of truth.

const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';
const ADMIN_PASS = 'zhive2026'; // matches App.jsx admin gate

const VALID_TIMES = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

function sb(path, opts, key) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

// YYYY-MM-DD in a stable way (no timezone drift)
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return false;
  const day = d.getDay();
  if (day === 0 || day === 6) return false; // no weekends
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const max = new Date(today); max.setDate(max.getDate() + 31);
  return d >= today && d <= max;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (!sbKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  try {
    // ── GET ──
    if (req.method === 'GET') {
      // admin: full list, password-gated
      if (req.query?.admin !== undefined) {
        if (String(req.query.admin) !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
        const r = await sb('appointments?select=*&order=date.asc,time.asc', { method: 'GET' }, sbKey);
        const appointments = r.ok ? await r.json() : [];
        return res.status(200).json({ appointments });
      }
      // public: just the taken slot keys, so the UI can grey them out
      const r = await sb('appointments?select=date,time', { method: 'GET' }, sbKey);
      const rows = r.ok ? await r.json() : [];
      const taken = rows.map((x) => `${x.date} ${x.time}`);
      return res.status(200).json({ taken });
    }

    // ── POST: book a slot ──
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};

      const date = String(body.date || '').trim();
      const time = String(body.time || '').trim();
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const company = String(body.company || '').trim();
      const note = String(body.note || '').trim();

      if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
      if (!email.includes('@')) return res.status(400).json({ error: 'Enter a valid email' });
      if (!isValidDate(date)) return res.status(400).json({ error: 'Pick a weekday within the next month' });
      if (!VALID_TIMES.includes(time)) return res.status(400).json({ error: 'Pick a valid time slot' });

      // double-booking guard: is this exact date+time already taken?
      const chk = await sb(`appointments?date=eq.${encodeURIComponent(date)}&time=eq.${encodeURIComponent(time)}&select=id`, { method: 'GET' }, sbKey);
      if (chk.ok) {
        const existing = await chk.json();
        if (existing.length > 0) return res.status(409).json({ error: 'That slot was just taken — please pick another' });
      }

      const row = {
        date, time,
        name: name.slice(0, 140),
        email: email.slice(0, 160),
        company: company.slice(0, 160),
        note: note.slice(0, 1000),
      };

      const ins = await sb('appointments', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify([row]),
      }, sbKey);

      if (!ins.ok) {
        const t = await ins.text();
        // Unique constraint (if added at DB level) will land here too
        if (t.includes('duplicate') || t.includes('unique')) {
          return res.status(409).json({ error: 'That slot was just taken — please pick another' });
        }
        return res.status(500).json({ error: 'Booking failed: ' + t.slice(0, 200) });
      }

      const saved = await ins.json();
      return res.status(200).json({ ok: true, appointment: saved[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
