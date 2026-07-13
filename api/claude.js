export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const prompt = body.prompt || '';
    const maxTokens = parseInt(body.maxTokens) || 500;
    const key = process.env.ANTHROPIC_API_KEY;

    if (!key) return res.status(401).json({ error: 'ANTHROPIC_API_KEY not set' });
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': key,
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: 'Anthropic API error: ' + errText });
    }

    const data = await r.json();
    if (data.error) return res.status(400).json({ error: data.error.message || 'API error' });

    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + (err.message || 'unknown') });
  }
}
