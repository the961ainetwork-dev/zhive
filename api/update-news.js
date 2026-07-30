// Daily cron — generates fresh AI news stories with full articles + sources.
// Safe-by-design: inserts the new batch FIRST, then deletes the old one, so the
// news band is never left empty if a step fails or the function times out.
const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';

// How many stories to generate per run. Kept modest so the whole job (web search
// + writing full articles) finishes inside the function's time budget. Raise
// gradually only after confirming runs complete well under maxDuration.
const STORY_COUNT = 6;

function sbHeaders(sbKey, extra) {
  return {
    apikey: sbKey,
    Authorization: `Bearer ${sbKey}`,
    ...(extra || {}),
  };
}

export default async function handler(req, res) {
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    const sbKey = process.env.SUPABASE_SERVICE_KEY;
    if (!key) return res.status(401).json({ error: 'ANTHROPIC_API_KEY not set' });
    if (!sbKey) return res.status(401).json({ error: 'SUPABASE_SERVICE_KEY not set' });

    // ── 1. Generate stories (single Claude call with web search) ──
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': key,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 6000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search the web for the most important AI and agentic AI news from the last 24 hours. Do a few focused searches covering: model releases, agentic AI, funding, and MENA tech. Then write exactly ${STORY_COUNT} news stories as a JSON array. Each story must have:
- "tag": short category like "Model release", "Agentic AI", "Industry", "Funding", "Research", "MENA"
- "date": today's date formatted like "Jul 30, 2026"
- "emoji": one relevant emoji
- "title": punchy headline, max 12 words, energetic tone for young entrepreneurs
- "body": 2-3 sentence teaser in plain language
- "article": the FULL story, 3-4 paragraphs separated by \\n\\n. Written for MENA entrepreneurs: what happened, why it matters for their business, one practical takeaway at the end. Plain language.
- "source": the publication or company the news came from, e.g. "TechCrunch", "Anthropic blog", "Reuters"
- "read": estimated read time like "3 min read"

Respond ONLY with the JSON array. No markdown, no backticks, no preamble.`
        }],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: 'Anthropic error: ' + t });
    }

    const data = await r.json();
    const fullText = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    let stories;
    try {
      const clean = fullText.replace(/```json|```/g, '').trim();
      const start = clean.indexOf('[');
      const end = clean.lastIndexOf(']') + 1;
      stories = JSON.parse(clean.slice(start, end));
    } catch (e) {
      return res.status(500).json({ error: 'Could not parse stories JSON', raw: fullText.slice(0, 500) });
    }

    if (!Array.isArray(stories) || stories.length === 0) {
      // Nothing usable — do NOT touch the table, leave existing news in place.
      return res.status(500).json({ error: 'No stories generated; existing news left untouched' });
    }

    const rows = stories.map(s => ({
      tag: s.tag, date: s.date, emoji: s.emoji,
      title: s.title, body: s.body, article: s.article || '',
      source: s.source || '', read: s.read,
    }));

    // ── 2. Capture the IDs of the CURRENT batch (to delete later) ──
    // Doing this before insert lets us delete exactly the old rows afterwards,
    // so the new rows are never caught in the delete.
    let oldIds = [];
    try {
      const cur = await fetch(`${SUPABASE_URL}/rest/v1/news_stories?select=id`, {
        headers: sbHeaders(sbKey),
      });
      if (cur.ok) oldIds = (await cur.json()).map(x => x.id);
    } catch { /* if this fails we simply skip cleanup this run */ }

    // ── 3. INSERT the new batch FIRST ──
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/news_stories`, {
      method: 'POST',
      headers: sbHeaders(sbKey, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify(rows),
    });

    if (!ins.ok) {
      const t = await ins.text();
      // Insert failed — old news is still intact because we haven't deleted yet.
      return res.status(500).json({ error: 'Supabase insert failed; existing news left untouched: ' + t });
    }

    // ── 4. Only now delete the OLD batch ──
    // New stories are safely stored; remove the previous ones by their captured IDs.
    if (oldIds.length) {
      try {
        const idList = oldIds.join(',');
        await fetch(`${SUPABASE_URL}/rest/v1/news_stories?id=in.(${idList})`, {
          method: 'DELETE',
          headers: sbHeaders(sbKey),
        });
      } catch { /* stale rows may linger, but the band still shows fresh news */ }
    }

    return res.status(200).json({ ok: true, count: rows.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
