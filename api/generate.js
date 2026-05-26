// Vercel Serverless Function — POST /api/generate
// Uses Google Gemini API (free tier) server-side so the API key never reaches the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY niet ingesteld in Vercel environment variables.' });
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

Antwoord ALLEEN met JSON in dit exacte formaat (geen andere tekst, geen markdown code blocks):
{
  "variants": [
    {"style": "Grappig & Speels", "bio": "..."},
    {"style": "Mysterieus & Intrigerend", "bio": "..."},
    {"style": "Direct & Confident", "bio": "..."},
    {"style": "Warm & Authentiek", "bio": "..."},
    {"style": "Creatief & Uniek", "bio": "..."}
  ]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return res.status(502).json({ error: `Gemini API gaf een fout (${geminiResponse.status}). Check je API key en quota op aistudio.google.com.` });
    }

    const data = await geminiResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return res.status(500).json({ error: 'AI gaf geen antwoord. Probeer opnieuw.' });
    }

    // Parse JSON uit het antwoord (mocht het toch wat extra tekst bevatten)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI gaf een onverwacht antwoord. Probeer opnieuw.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(500).json({ error: 'Kon AI-antwoord niet parsen. Probeer opnieuw.' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
