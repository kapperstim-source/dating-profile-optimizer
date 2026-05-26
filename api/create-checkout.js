// Vercel Serverless Function — POST /api/create-checkout
// Maakt een Stripe Checkout Session en retourneert de redirect URL.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({
      error: 'STRIPE_SECRET_KEY niet ingesteld in Vercel environment variables.'
    });
  }

  try {
    // Bouw success_url + cancel_url vanaf de huidige host
    const host = req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${proto}://${host}`;

    const successUrl = `${baseUrl}/?paid=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/?paid=false`;

    // Stripe Checkout Sessions API call (geen npm pkg nodig — direct HTTP)
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('payment_method_types[]', 'card');

    // Inline price (geen prijs ID nodig in Stripe)
    params.append('line_items[0][price_data][currency]', 'eur');
    params.append('line_items[0][price_data][product_data][name]', 'Dating Profile Optimizer — 24u premium toegang');
    params.append('line_items[0][price_data][product_data][description]', 'Alle 5 bio-varianten + foto enhancement, 24 uur onbeperkt gebruik');
    params.append('line_items[0][price_data][unit_amount]', '499'); // €4.99 in cents
    params.append('line_items[0][quantity]', '1');

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error('Stripe API error:', data);
      return res.status(502).json({
        error: data.error?.message || `Stripe API fout (${stripeResponse.status})`
      });
    }

    return res.status(200).json({ url: data.url, sessionId: data.id });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
