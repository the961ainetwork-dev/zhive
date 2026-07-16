// ZHIVE Business Brain — Phase 1
// GET    /api/brain?userId=X             → list items
// GET    /api/brain?userId=X&format=context → compiled context string for agents
// POST   /api/brain  { userId, kind, title, content }          → add item
// POST   /api/brain  { userId, action:"extract", raw }         → AI structures a messy dump into items
// PUT    /api/brain  { userId, id, title?, content?, kind? }   → update item
// DELETE /api/brain?userId=X&id=N        → delete item

const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';
const KINDS = ['profile', 'products', 'pricing', 'policies', 'customers', 'operations', 'legal', 'playbook', 'notes'];

function sb(path, opts, key) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
      ...(opts.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (!sbKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const userId = String(req.query?.userId || body.userId || '').trim();
  if (!userId || userId.length > 120) return res.status(400).json({ error: 'userId required' });
  const uid = encodeURIComponent(userId);

  try {
    // ── LIST or COMPILED CONTEXT ──
    if (req.method === 'GET') {
      const r = await sb(`brain_items?user_id=eq.${uid}&select=*&order=kind.asc,id.asc`, { method: 'GET' }, sbKey);
      const items = r.ok ? await r.json() : [];
      if (req.query?.format === 'context') {
        if (!items.length) return res.status(200).json({ context: '' });
        const byKind = {};
        for (const it of items) (byKind[it.kind] = byKind[it.kind] || []).push(it);
        let ctx = '';
        for (const k of Object.keys(byKind)) {
          ctx += `## ${k.toUpperCase()}\n`;
          for (const it of byKind[k]) ctx += `### ${it.title}\n${it.content}\n\n`;
        }
        // Hard cap ~24k chars to protect context windows
        if (ctx.length > 24000) ctx = ctx.slice(0, 24000) + '\n[...brain truncated]';
        return res.status(200).json({ context: ctx, count: items.length });
      }
      return res.status(200).json({ items });
    }

    // ── ADD, AI-EXTRACT, or LEARN-FROM-APPROVAL ──
    if (req.method === 'POST') {
      // Phase 2: distill an approved output into reusable playbook knowledge
      if (body.action === 'learn') {
        const { agentName, task, output } = body;
        const out = String(output || '').slice(0, 12000);
        if (out.length < 60) return res.status(400).json({ error: 'Output too short to learn from' });
        const aKey = process.env.ANTHROPIC_API_KEY;
        if (!aKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

        const ar = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': aKey },
          body: JSON.stringify({
            model: 'claude-haiku-4-5',
            max_tokens: 900,
            messages: [{
              role: 'user',
              content: `A founder just APPROVED this AI output. Distill what this approval teaches about HOW THIS COMPANY LIKES WORK DONE — reusable rules any future agent should follow (tone, structure, language mix, level of detail, decisions made, preferences shown). NOT the content itself.

Return a JSON array of 1-2 items max:
- "title": short rule name (max 8 words), e.g. "Instagram tone: playful Lebanese Arabic + English"
- "content": the reusable rule in 2-4 sentences, imperative voice ("Use...", "Always...", "Keep...")

Only genuinely reusable patterns. If nothing generalizable, return []. Respond ONLY with the JSON array.

AGENT: ${String(agentName || 'unknown').slice(0, 80)}
TASK: ${String(task || '').slice(0, 500)}
APPROVED OUTPUT:
${out}`
            }],
          }),
        });
        if (!ar.ok) return res.status(200).json({ ok: false, learned: 0 });
        const ad = await ar.json();
        const txt = (ad.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
        let rules = [];
        try {
          const clean = txt.replace(/```json|```/g, '').trim();
          const s0 = clean.indexOf('['); const s1 = clean.lastIndexOf(']') + 1;
          if (s0 >= 0) rules = JSON.parse(clean.slice(s0, s1));
        } catch { rules = []; }
        rules = (rules || []).filter(r => r.title && r.content)
          .map(r => ({ user_id: userId, kind: 'playbook', source: 'learned', title: String(r.title).slice(0, 140), content: String(r.content).slice(0, 2000) }));
        if (!rules.length) return res.status(200).json({ ok: true, learned: 0 });
        const ir = await sb('brain_items', { method: 'POST', body: JSON.stringify(rules) }, sbKey);
        if (!ir.ok) return res.status(200).json({ ok: false, learned: 0 });

        // Cap learned playbook at 30 items — evict oldest beyond that
        const lr = await sb(`brain_items?user_id=eq.${uid}&source=eq.learned&select=id&order=id.desc`, { method: 'GET' }, sbKey);
        if (lr.ok) {
          const all = await lr.json();
          if (all.length > 30) {
            const evict = all.slice(30).map(x => x.id).join(',');
            await sb(`brain_items?id=in.(${evict})&user_id=eq.${uid}`, { method: 'DELETE' }, sbKey);
          }
        }
        return res.status(200).json({ ok: true, learned: rules.length });
      }

      if (body.action === 'extract') {
        const raw = String(body.raw || '').slice(0, 30000);
        if (raw.length < 30) return res.status(400).json({ error: 'Paste at least a sentence or two' });
        const aKey = process.env.ANTHROPIC_API_KEY;
        if (!aKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

        const ar = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': aKey },
          body: JSON.stringify({
            model: 'claude-haiku-4-5',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: `You are building a Business Brain — structured company knowledge for AI agents to use. Below is a raw dump from a founder (may be messy: notes, price lists, policies, WhatsApp text, Arabic and/or English).

Extract every distinct piece of business knowledge into a JSON array. Each item:
- "kind": one of ${JSON.stringify(KINDS)}
- "title": short specific label (max 8 words)
- "content": the knowledge itself, cleaned and complete, preserving exact numbers/prices/terms. Keep the original language.

Only extract what is actually stated — never invent. Merge duplicates. Respond ONLY with the JSON array, no markdown.

RAW DUMP:
${raw}`
            }],
          }),
        });
        if (!ar.ok) return res.status(ar.status).json({ error: 'AI error: ' + (await ar.text()).slice(0, 300) });
        const ad = await ar.json();
        const txt = (ad.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
        let items;
        try {
          const clean = txt.replace(/```json|```/g, '').trim();
          items = JSON.parse(clean.slice(clean.indexOf('['), clean.lastIndexOf(']') + 1));
        } catch { return res.status(500).json({ error: 'Could not parse extraction', raw: txt.slice(0, 300) }); }
        items = (items || []).filter(i => i.title && i.content)
          .map(i => ({ user_id: userId, kind: KINDS.includes(i.kind) ? i.kind : 'notes', title: String(i.title).slice(0, 140), content: String(i.content).slice(0, 6000) }));
        if (!items.length) return res.status(400).json({ error: 'Nothing extractable found' });
        const ir = await sb('brain_items', { method: 'POST', body: JSON.stringify(items) }, sbKey);
        if (!ir.ok) return res.status(500).json({ error: 'Insert failed: ' + (await ir.text()).slice(0, 200) });
        return res.status(200).json({ ok: true, added: items.length, items: await ir.json() });
      }

      // plain add
      const { kind, title, content } = body;
      if (!title || !content) return res.status(400).json({ error: 'title and content required' });
      const row = { user_id: userId, kind: KINDS.includes(kind) ? kind : 'notes', title: String(title).slice(0, 140), content: String(content).slice(0, 6000) };
      const r = await sb('brain_items', { method: 'POST', body: JSON.stringify([row]) }, sbKey);
      if (!r.ok) return res.status(500).json({ error: 'Insert failed: ' + (await r.text()).slice(0, 200) });
      return res.status(200).json({ ok: true, items: await r.json() });
    }

    // ── UPDATE ──
    if (req.method === 'PUT') {
      const { id, title, content, kind } = body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const patch = {};
      if (title) patch.title = String(title).slice(0, 140);
      if (content) patch.content = String(content).slice(0, 6000);
      if (kind && KINDS.includes(kind)) patch.kind = kind;
      const r = await sb(`brain_items?id=eq.${Number(id)}&user_id=eq.${uid}`, { method: 'PATCH', body: JSON.stringify(patch) }, sbKey);
      if (!r.ok) return res.status(500).json({ error: 'Update failed' });
      return res.status(200).json({ ok: true });
    }

    // ── DELETE ──
    if (req.method === 'DELETE') {
      const id = Number(req.query?.id || body.id);
      if (!id) return res.status(400).json({ error: 'id required' });
      const r = await sb(`brain_items?id=eq.${id}&user_id=eq.${uid}`, { method: 'DELETE' }, sbKey);
      if (!r.ok) return res.status(500).json({ error: 'Delete failed' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
