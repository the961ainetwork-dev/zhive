const SUPABASE_URL = 'https://ldlzpnuvkudmvpvnbomc.supabase.co';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600'); // cache 1 hour on Vercel edge
  try {
    const sbKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!sbKey) return res.status(200).json({ stories: [] });

    const r = await fetch(`${SUPABASE_URL}/rest/v1/news_stories?select=*&order=id.asc`, {
      headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` },
    });
    const stories = r.ok ? await r.json() : [];
    return res.status(200).json({ stories });
  } catch {
    return res.status(200).json({ stories: [] });
  }
}
