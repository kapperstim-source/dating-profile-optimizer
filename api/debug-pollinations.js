// Debug endpoint - toont raw Pollinations response
export default async function handler(req, res) {
  try {
    const r = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [{ role: 'user', content: 'Return a JSON object {"hello":"world","number":42}' }],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      })
    });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
    return res.status(200).json({
      status: r.status,
      ok: r.ok,
      rawText: text.slice(0, 1500),
      parsed: parsed ? {
        keys: Object.keys(parsed),
        content: parsed.choices?.[0]?.message?.content?.slice(0, 500),
        contentType: typeof parsed.choices?.[0]?.message?.content
      } : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
