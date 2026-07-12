// Voice proxy — speech-to-text and text-to-speech via ElevenLabs.
// Requires ELEVENLABS_API_KEY in Vercel env vars (free tier works for testing).
// Optional: ELEVENLABS_VOICE_ID to pick a specific voice (defaults to a multilingual
// voice; the flash multilingual model speaks Arabic and matches the reply text language).
// Actions: { action: "transcribe", audio: <base64>, mime } -> { text }
//          { action: "speak", text } -> { audio: <base64 mp3>, mime }

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed" } });
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: "Voice is not configured yet: set ELEVENLABS_API_KEY in Vercel environment variables." } });
  }
  try {
    const { action } = req.body || {};

    if (action === "transcribe") {
      const { audio, mime = "audio/webm" } = req.body;
      if (!audio) return res.status(400).json({ error: { message: "No audio received" } });
      const buf = Buffer.from(audio, "base64");
      if (buf.length > 3_500_000) return res.status(400).json({ error: { message: "Recording too long — keep it under ~30 seconds." } });
      const form = new FormData();
      form.append("file", new Blob([buf], { type: mime }), "audio.webm");
      form.append("model_id", "scribe_v1");
      const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": key },
        body: form,
      });
      const data = await r.json();
      if (!r.ok) {
        const msg = data?.detail?.message || (typeof data?.detail === "string" ? data.detail : "Transcription failed");
        return res.status(r.status).json({ error: { message: msg } });
      }
      return res.status(200).json({ text: data.text || "" });
    }

    if (action === "speak") {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: { message: "No text to speak" } });
      const voice = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: String(text).slice(0, 1200),
          model_id: "eleven_flash_v2_5", // multilingual + low latency; speaks Arabic when the text is Arabic
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        const msg = e?.detail?.message || (typeof e?.detail === "string" ? e.detail : "Speech generation failed");
        return res.status(r.status).json({ error: { message: msg } });
      }
      const ab = await r.arrayBuffer();
      return res.status(200).json({ audio: Buffer.from(ab).toString("base64"), mime: "audio/mpeg" });
    }

    return res.status(400).json({ error: { message: "Unknown action" } });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message || "Voice proxy error" } });
  }
}
