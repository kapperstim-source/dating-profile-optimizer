// Vercel Serverless Function — GET /api/verify-payment?session_id=...
// Verifieert bij Stripe of een Checkout Session daadwerkelijk betaald is.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY niet ingesteld.' });
  }

  const sessionId = req.query.session_id;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'session_id is verplicht.' });
  }

  try {
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${stripeKey}` }
      }
    );

    const data = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error('Stripe verify error:', data);
      return res.status(502).json({
        error: data.error?.message || 'Kon betaling niet verifiëren'
      });
    }

    const paid = data.payment_status === 'paid';
    return res.status(200).json({
      paid,
      paymentStatus: data.payment_status,
      amountTotal: data.amount_total,
      currency: data.currency
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message || 'Onbekende serverfout' });
  }
}
