// Vercel Serverless Function — POST /api/generate
// Pollinations.ai - 1 call voor 5 bios. Pollinations anonymous tier heeft ~1500 token cap.
// Door bios kort te houden (60 woorden = ~80 tokens elk), past alles binnen het cap.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bio = '', age = '', gender = '', interests = '', goal = '' } = req.body || {};

    if (!bio || bio.trim().length < 3) {
      return res.status(400).json({ error: 'Bio is verplicht (minimaal 3 tekens).' });
    }

    const prompt = `Verbeter deze dating bio. Genereer 5 versies, elke max 55 woorden.

Input bio: "${bio}"
Leeftijd: ${age || '?'} | Geslacht: ${gender || '?'} | Interesses: ${interests || '?'} | Doel: ${goal || '?'}

Stijlen:
1. funny - grappig, speels, zelfspot
2. mysterious - mysterieus, intrigerend
3. confident - direct, zelfverzekerd
4. warm - warm, authentiek
5. creative - creatief, uniek

Antwoord ALLEEN dit JSON formaat, geen extra tekst:
{"variants":[{"style":"Grappig & Speels","bio":"..."},{"style":"Mysterieus & Intrigerend","bio":"..."},{"style":"Direct & Confident","bio":"..."},{"style":"Warm & Authentiek","bio":"..."},{"style":"Creatief & Uniek","bio":"..."}]}

Schrijf in Nederlands. Geen clichés. Specifiek. Max 55 woorden per bio.`;

    const pollResponse = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 1400,
        response_format: { type: 'json_object' }
      })
    });

    if (!pollResponse.ok) {
      const errText = await pollResponse.text();
      console.error('Pollinations error:', errText.slice(0, 300));
      return res.status(502).json({
        error: `AI service fout (${pollResponse.status}). Probeer opnieuw over een paar seconden.`
      });
    }

    const data = await pollResponse.json();
    const text = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason;

    if (!text) {
      console.error('Empty Pollinations response. Full:', JSON.stringify(data).slice(0, 400));
      return res.status(500).json({ error: 'AI gaf geen antwoord. Probeer opnieuw.' });
    }

    let parsed;
    let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) {
        console.error('No JSON braces. Raw:', text.slice(0, 400), 'Finish:', finishReason);
        return res.status(500).json({ error: 'AI gaf een onverwacht antwoord. Probeer opnieuw.' });
      }
      try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } catch (e2) {
        console.error('Parse failed. Raw:', text.slice(0, 500), 'Finish:', finishReason);
        return res.status(500).json({ error: 'Kon AI-antwoord niet parsen. Probeer opnieuw.' });
      }
    }

    if (!parsed.variants || !Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      return res.status(500).json({ error: 'AI gaf antwoord in onverwacht formaat.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
