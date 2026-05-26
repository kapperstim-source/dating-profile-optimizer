// Debug endpoint - test exact bio call
export default async function handler(req, res) {
  try {
    const prompt = `Je bent een expert dating profile copywriter.

Huidige bio: "koken hardlopen marketing"
Leeftijd: 28
Geslacht: man
Interesses: sport, koffie
Doel: serieuze relatie

Genereer 5 versies in JSON formaat:
{"variants":[{"style":"Grappig & Speels","bio":"..."},{"style":"Mysterieus & Intrigerend","bio":"..."},{"style":"Direct & Confident","bio":"..."},{"style":"Warm & Authentiek","bio":"..."},{"style":"Creatief & Uniek","bio":"..."}]}

Schrijf in Nederlands, max 100 woorden per variant. Alleen JSON, geen extra tekst.`;

    const r = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
    const content = parsed?.choices?.[0]?.message?.content || '';
    return res.status(200).json({
      status: r.status,
      model: parsed?.model,
      contentLength: content.length,
      contentStart: content.slice(0, 800),
      usage: parsed?.usage,
      finishReason: parsed?.choices?.[0]?.finish_reason
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
