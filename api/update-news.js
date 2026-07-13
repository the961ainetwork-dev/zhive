// Runs daily via Vercel Cron (see vercel.json)
// Generates 5 fresh AI news stories using Claude + web search, saves to Supabase

const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';

export default async function handler(req, res) {
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    const sbKey = process.env.SUPABASE_SERVICE_KEY;
    if (!key) return res.status(401).json({ error: 'ANTHROPIC_API_KEY not set' });
    if (!sbKey) return res.status(401).json({ error: 'SUPABASE_SERVICE_KEY not set' });

    // 1. Ask Claude to find real AI news from the last 24h using web search
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': key,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 3000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search the web for the most important AI and agentic AI news from the last 24 hours. Then write exactly 5 news stories as a JSON array. Each story must have these fields:
- "tag": short category like "Model release", "Agentic AI", "Industry", "Funding", "Research"
- "date": today's date formatted like "Jul 13, 2026"
- "emoji": one relevant emoji
- "title": punchy headline, max 12 words, energetic tone for young entrepreneurs
- "body": 2-3 sentence summary in plain language, why it matters for business owners
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

    // Collect all text blocks (web search responses have multiple blocks)
    const fullText = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    // Parse the JSON array out of the response
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
      return res.status(500).json({ error: 'No stories generated' });
    }

    // 2. Replace today's stories in Supabase
    // Delete old stories
    await fetch(`${SUPABASE_URL}/rest/v1/news_stories?id=gt.0`, {
      method: 'DELETE',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
      },
    });

    // Insert new
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/news_stories`, {
      method: 'POST',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(stories.map(s => ({
        tag: s.tag, date: s.date, emoji: s.emoji,
        title: s.title, body: s.body, read: s.read,
      }))),
    });

    if (!ins.ok) {
      const t = await ins.text();
      return res.status(500).json({ error: 'Supabase insert failed: ' + t });
    }

    return res.status(200).json({ ok: true, count: stories.length, stories });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
