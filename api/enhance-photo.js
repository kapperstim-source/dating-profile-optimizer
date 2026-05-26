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

    // Parse data URL
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

    // Probeer meerdere modelnamen tot er één werkt
    const modelCandidates = [
      'gemini-3-pro-image-preview',
      'gemini-3.1-flash-image-preview',
      'gemini-2.5-flash-image'
    ];

    const requestBody = JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    let geminiResponse;
    let lastError = '';
    let lastStatus = 0;
    let workingModel = '';

    for (const model of modelCandidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });
      if (geminiResponse.ok) {
        workingModel = model;
        break;
      }
      lastStatus = geminiResponse.status;
      lastError = await geminiResponse.text();
      console.error(`Model ${model} failed (${geminiResponse.status}):`, lastError.slice(0, 200));
    }

    if (!geminiResponse.ok) {
      return res.status(502).json({
        error: `Geen werkend Gemini Image model gevonden (laatste status: ${lastStatus}). Mogelijk niet beschikbaar in je regio of quota op.`
      });
    }

    const data = await geminiResponse.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    // Zoek de image part in de response
    let outImage = null;
    for (const part of parts) {
      const inline = part.inline_data || part.inlineData;
      if (inline) {
        const outMime = inline.mime_type || inline.mimeType || 'image/png';
        outImage = `data:${outMime};base64,${inline.data}`;
        break;
      }
    }

    if (!outImage) {
      console.error('No image in Gemini response:', JSON.stringify(data).slice(0, 500));
      return res.status(500).json({ error: 'AI gaf geen afbeelding terug. Probeer opnieuw of gebruik een andere foto.' });
    }

    return res.status(200).json({ image: outImage, model: workingModel });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
