// Vercel Serverless Function — POST /api/enhance-photo
// Gemini 2.5 Flash Image ("Nano Banana") - foto naar fotograaf-stijl

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY niet ingesteld in Vercel environment variables.' });
  }

  try {
    const { image } = req.body || {};

    if (!image || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Geldige image data URL is verplicht.' });
    }

    // Parse data URL: "data:image/jpeg;base64,/9j/4AAQ..."
    const match = image.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
    if (!match) {
      return res.status(400).json({ error: 'Ongeldige image data URL.' });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const prompt = `Verbeter deze dating-profielfoto naar een professionele fotograaf-stijl:
- Verbeter de belichting (zachter, warmer licht, betere highlights/schaduwen)
- Verhoog de scherpte en details, vooral op de ogen en gezichtskenmerken
- Maak kleuren rijker en natuurlijker (huid moet er gezond en levendig uitzien)
- Verbeter de huid subtiel (kleine oneffenheden, donkere kringen, vermoeidheid)
- Geef het de uitstraling van een professionele dating-app foto

BELANGRIJK:
- BEHOUD het exacte gezicht en de identiteit van de persoon — geen morphing of catfishing
- Behoud kleding, haar stijl, lichaamshouding en compositie precies zoals het is
- Geen onnatuurlijke filters, geen gladde plastic huid
- Het resultaat moet er natuurlijk uitzien, niet over-bewerkt

Retourneer alleen de verbeterde foto.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          responseModalities: ['IMAGE']
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini Image API error:', errText.slice(0, 500));
      return res.status(502).json({
        error: `Gemini Image API fout (${geminiResponse.status}). Mogelijk quota op of model niet beschikbaar.`
      });
    }

    const data = await geminiResponse.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    // Zoek de image part in de response
    let outImage = null;
    for (const part of parts) {
      if (part.inline_data || part.inlineData) {
        const inline = part.inline_data || part.inlineData;
        const outMime = inline.mime_type || inline.mimeType || 'image/png';
        const outData = inline.data;
        outImage = `data:${outMime};base64,${outData}`;
        break;
      }
    }

    if (!outImage) {
      console.error('No image in Gemini response:', JSON.stringify(data).slice(0, 500));
      return res.status(500).json({ error: 'AI gaf geen afbeelding terug. Probeer opnieuw of gebruik een andere foto.' });
    }

    return res.status(200).json({ image: outImage });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
