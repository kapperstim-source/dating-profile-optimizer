// Vercel Serverless Function — POST /api/generate-photo
// Pollinations.ai image API - 100% gratis text-to-image generation

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      gender = 'man',
      age = '28',
      hair = '',
      style = 'casual',
      setting = 'cafe',
      ethnicity = '',
      extra = ''
    } = req.body || {};

    // Bouw een prompt voor professionele dating profielfoto
    const settings = {
      cafe: 'in a cozy modern cafe with warm natural light, blurred bokeh background',
      outdoor: 'outdoors in golden hour sunlight, scenic background',
      beach: 'on a sunny beach during golden hour, ocean in soft focus background',
      city: 'walking through a stylish city street, urban architecture blurred behind',
      studio: 'professional studio portrait with soft rim lighting and neutral backdrop',
      nature: 'in a beautiful forest or park, dappled natural light, soft green background'
    };

    const styles = {
      casual: 'wearing trendy casual clothes, relaxed friendly pose, genuine warm smile',
      smart: 'wearing smart casual attire (blazer or stylish shirt), confident posture, slight smile',
      formal: 'wearing elegant formal outfit, sophisticated pose, charming expression',
      sporty: 'wearing athletic clothing, energetic active pose, healthy glow',
      creative: 'wearing artistic outfit with personality, expressive pose, intriguing look'
    };

    const settingDesc = settings[setting] || settings.cafe;
    const styleDesc = styles[style] || styles.casual;

    const hairDesc = hair ? `${hair} hair, ` : '';
    const ethnicityDesc = ethnicity ? `${ethnicity}, ` : '';
    const extraDesc = extra ? `, ${extra}` : '';

    const prompt = `professional dating app profile photo of an attractive ${age}-year-old ${ethnicityDesc}${gender} with ${hairDesc}${styleDesc}, ${settingDesc}, professional photography, photorealistic, high quality, magazine quality, sharp focus on face, natural skin texture, professional lighting, depth of field, beautiful natural smile, looks like a real person not AI generated${extraDesc}`;

    // Pollinations Image API - GET endpoint with prompt in URL
    const encodedPrompt = encodeURIComponent(prompt);
    const width = 768;
    const height = 1024;
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;

    // Fetch image en converteer naar base64 data URL
    const imgResponse = await fetch(imageUrl);

    if (!imgResponse.ok) {
      console.error('Pollinations image error:', imgResponse.status);
      return res.status(502).json({
        error: `Foto generatie fout (${imgResponse.status}). Probeer opnieuw over 30 seconden.`
      });
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return res.status(200).json({
      image: dataUrl,
      prompt: prompt.slice(0, 200) + '...',
      seed
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
