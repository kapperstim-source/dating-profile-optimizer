// Debug endpoint: lijst alle beschikbare Gemini modellen voor de huidige API key
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY niet ingesteld' });
  }
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await r.json();
    if (!r.ok) return res.status(502).json(data);
    // Filter voor models die generateContent ondersteunen
    const models = (data.models || []).map(m => ({
      name: m.name,
      displayName: m.displayName,
      supportedMethods: m.supportedGenerationMethods || []
    }));
    return res.status(200).json({ count: models.length, models });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
