// Vercel Serverless Function — POST /api/generate
// Pollinations.ai - 5 parallel calls voor 5 verschillende bio stijlen
// Pollinations anonymous tier heeft ~1500 token limit per call

const STYLES = [
  { name: 'Grappig & Speels', tone: 'humoristisch en speels, met self-deprecating humor, geestig, prikkelend' },
  { name: 'Mysterieus & Intrigerend', tone: 'mysterieus en intrigerend, prikkelt nieuwsgierigheid, beetje cryptisch' },
  { name: 'Direct & Confident', tone: 'direct, zelfverzekerd, duidelijk over wat je wilt en wie je bent' },
  { name: 'Warm & Authentiek', tone: 'warm, authentiek, genuine, uitnodigend, oprecht' },
  { name: 'Creatief & Uniek', tone: 'creatief, uniek, kunstzinnig, opvalt tussen de massa' }
];

async function generateOneBio(prompt, style) {
  const fullPrompt = `${prompt}

Schrijf in een ${style.tone} stijl. Max 100 woorden. Geen clichés. Specifiek en concreet. Eindig met een vraag of conversatie-opener. Schrijf in Nederlands. Geef ALLEEN de bio tekst terug, geen labels of uitleg.`;

  const r = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: [{ role: 'user', content: fullPrompt }],
      temperature: 0.95,
      max_tokens: 400
    })
  });

  if (!r.ok) {
    throw new Error(`Pollinations fout (${r.status})`);
  }

  const data = await r.json();
  let text = data.choices?.[0]?.message?.content?.trim() || '';
  // Strip quotes/markdown
  text = text.replace(/^["']/, '').replace(/["']$/, '').trim();
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bio = '', age = '', gender = '', interests = '', goal = '' } = req.body || {};

    if (!bio || bio.trim().length < 3) {
      return res.status(400).json({ error: 'Bio is verplicht (minimaal 3 tekens).' });
    }

    const basePrompt = `Schrijf een verbeterde dating profile bio voor iemand met deze info:
Huidige bio: "${bio}"
Leeftijd: ${age || 'niet opgegeven'}
Geslacht: ${gender || 'niet opgegeven'}
Interesses: ${interests || 'niet opgegeven'}
Doel: ${goal || 'serieuze relatie'}`;

    // Genereer 5 bios PARALLEL (sneller en omzeilt token limit per call)
    const results = await Promise.allSettled(
      STYLES.map(style => generateOneBio(basePrompt, style))
    );

    const variants = results.map((r, i) => ({
      style: STYLES[i].name,
      bio: r.status === 'fulfilled' ? r.value : '(Kon deze variant niet genereren, probeer opnieuw)'
    }));

    // Als alle bios faalden, return error
    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed) {
      console.error('All bio generations failed:', results.map(r => r.reason?.message));
      return res.status(502).json({ error: 'AI service is tijdelijk niet beschikbaar. Probeer over een paar seconden opnieuw.' });
    }

    return res.status(200).json({ variants });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
