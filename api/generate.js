// Vercel Serverless Function — POST /api/generate
// Pollinations.ai text API - 100% gratis, geen API key nodig

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bio = '', age = '', gender = '', interests = '', goal = '' } = req.body || {};

    if (!bio || bio.trim().length < 3) {
      return res.status(400).json({ error: 'Bio is verplicht (minimaal 3 tekens).' });
    }

    const prompt = `Je bent een expert dating profile copywriter. Iemand wil hun dating bio verbeteren.

Huidige bio: "${bio}"
Leeftijd: ${age || 'niet opgegeven'}
Geslacht: ${gender || 'niet opgegeven'}
Interesses: ${interests || 'niet opgegeven'}
Doel: ${goal || 'niet opgegeven'}

Genereer 5 verschillende verbeterde versies van deze bio. Elke versie moet een andere stijl hebben:
1. Grappig & speels - met humor en wat zelfspot
2. Mysterieus & intrigerend - prikkelt nieuwsgierigheid
3. Direct & confident - duidelijk over wat ze willen
4. Warm & authentiek - genuine en uitnodigend
5. Creatief & uniek - opvalt tussen de massa

Regels:
- Schrijf in dezelfde taal als de input bio (Nederlands of Engels)
- Maximaal 150 woorden per variant
- Geen clichés zoals "ik hou van reizen en lachen"
- Specifiek en concreet, geen vage uitspraken
- Wees authentiek - niet over-de-top of nep
- Voeg af en toe een vraag toe die een opening biedt voor een gesprek

Antwoord ALLEEN met geldige JSON in dit exacte formaat (geen andere tekst, geen markdown):
{"variants":[{"style":"Grappig & Speels","bio":"..."},{"style":"Mysterieus & Intrigerend","bio":"..."},{"style":"Direct & Confident","bio":"..."},{"style":"Warm & Authentiek","bio":"..."},{"style":"Creatief & Uniek","bio":"..."}]}`;

    // Pollinations Text API (OpenAI-compatible)
    const pollResponse = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
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

    if (!text) {
      console.error('Empty Pollinations response:', JSON.stringify(data).slice(0, 300));
      return res.status(500).json({ error: 'AI gaf geen antwoord. Probeer opnieuw.' });
    }

    // Probeer direct JSON parse
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Fallback: extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: 'AI gaf een onverwacht antwoord. Probeer opnieuw.' });
      }
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        return res.status(500).json({ error: 'Kon AI-antwoord niet parsen. Probeer opnieuw.' });
      }
    }

    if (!parsed.variants || !Array.isArray(parsed.variants)) {
      return res.status(500).json({ error: 'AI gaf antwoord in onverwacht formaat.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
