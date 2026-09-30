// POST /api/checkout — turns the bag into a Stripe Checkout Session and returns its URL.
//
// Prices, stock and shipping come from site/js/products.js on the server, never from the
// browser, so nobody can edit the bag to pay less. Card details are entered on Stripe's own
// page and never touch this site.
//
// Needs one environment variable in Netlify: STRIPE_SECRET_KEY (sk_test_… or sk_live_…).
import { PRODUCTS, SHIPPING_CAD, stockOf } from '../../site/js/products.js';

export const config = { path: '/api/checkout' };

const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async req => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(503, { error: 'Card payments are not switched on yet. Choose e-transfer or cash for pickup.' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Bad request.' }); }
  const { items, fulfil, name = '', email = '', phone = '' } = body || {};
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return json(400, { error: 'Your bag is empty.' });
  if (fulfil !== 'pickup' && fulfil !== 'ship') return json(400, { error: 'Bad request.' });

  const origin = process.env.URL || new URL(req.url).origin;
  const orderNo = 'AD-' + Math.floor(1000 + Math.random() * 9000);
  const form = new URLSearchParams({
    mode: 'payment',
    currency: 'cad',
    locale: 'en',
    success_url: `${origin}/?paid=${fulfil}&order=${orderNo}#home`,
    cancel_url: `${origin}/?cancelled=1#shop`,
    'metadata[order]': orderNo,
    'metadata[fulfilment]': fulfil,
    'metadata[name]': String(name).slice(0, 200),
    'metadata[phone]': String(phone).slice(0, 50),
    'payment_intent_data[description]': `Aesty Design ${orderNo} (${fulfil === 'ship' ? 'ship' : 'pickup in Orillia'})`,
  });
  if (/^\S+@\S+\.\S+$/.test(email)) form.set('customer_email', email);

  const summary = [];
  for (const [i, it] of items.entries()) {
    const p = byId[it?.id];
    const qty = Number.parseInt(it?.qty, 10);
    if (!p || !(qty > 0)) return json(400, { error: 'Something in your bag is no longer available. Please refresh the page.' });
    if (qty > stockOf(p)) {
      return json(409, { error: stockOf(p) ? `Sorry, there's only ${stockOf(p)} ${p.name} available.` : `Sorry, ${p.name} has sold. Please remove it from your bag.` });
    }
    form.set(`line_items[${i}][quantity]`, String(qty));
    form.set(`line_items[${i}][price_data][currency]`, 'cad');
    form.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(p.price * 100)));
    form.set(`line_items[${i}][price_data][product_data][name]`, p.name);
    form.set(`line_items[${i}][price_data][product_data][description]`, p.tier);
    form.set(`line_items[${i}][price_data][product_data][images][0]`, `${origin}/${p.img}`);
    summary.push(`${qty}x ${p.id}`);
  }
  form.set('metadata[items]', summary.join(', ').slice(0, 500));

  if (fulfil === 'ship') {
    form.set('shipping_address_collection[allowed_countries][0]', 'CA');
    form.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    form.set('shipping_options[0][shipping_rate_data][display_name]', 'Canada Post, tracked');
    form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(Math.round(SHIPPING_CAD * 100)));
    form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'cad');
    form.set('phone_number_collection[enabled]', 'true');
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const session = await res.json();
  if (!res.ok) {
    console.error('Stripe error', session?.error?.message);
    return json(502, { error: "Couldn't reach the payment page." });
  }
  return json(200, { url: session.url });
};
