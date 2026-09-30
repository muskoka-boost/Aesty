# Aesty Design — website

Shop site for **Aesty Design**, handmade crystal jewellery from Orillia, Ontario.
Built from the Claude Design file *Aesty Design.dc.html* (Home, Shop, Custom, Contact, and the bag).

```
site/                      everything that gets published
  index.html               all four pages (switched with #home, #shop, #custom, #contact)
  css/style.css
  js/products.js           ← the catalogue: names, prices, stock, shipping rate
  js/app.js                shop filters, bag, checkout, forms
  assets/                  product photos, hero photos, logo
netlify/functions/
  checkout.mjs             creates the Stripe payment page (prices checked server-side)
netlify.toml               hosting config
v1/ … v5/, index.html      the old five concepts — not published, safe to delete
```

Plain HTML/CSS/JS. No build step, no npm install, no framework.

## How selling works

| Customer picks | What happens | Money |
|---|---|---|
| **Card** (pickup or shipping) | Sent to a Stripe-hosted payment page. Stripe collects the card (and shipping address when shipping) and emails Angel the order. | Paid up front |
| **E-transfer** (pickup only) | Order goes to Netlify Forms, which emails Angel. She texts the e-transfer details. | Before pickup |
| **Cash** (pickup only) | Same as above. | At pickup |
| **Custom request form** | Netlify Forms emails Angel. | Quoted by Angel |

Card details never touch this site. Prices are read from `site/js/products.js` on the server when
the Stripe page is created, so editing the bag in the browser can't change what's charged.

Until Stripe is connected, choosing Card shows *"Card payments are not switched on yet"* and
customers can still order with e-transfer or cash. The site works fine without it.

## Going live — one-time setup

1. **Netlify** (free): netlify.com → *Add new site → Import from GitHub* → pick this repo and
   branch. Settings are read from `netlify.toml`, so just press Deploy.
2. **Forms**: Netlify → *Forms* → enable form detection, redeploy once, then
   *Forms → Notifications → Email* to Angel's address for both `order` and `custom`.
3. **Stripe** (no monthly fee; about 2.9% + 30¢ per card sale in Canada): sign up at stripe.com,
   add the business and bank details. Then Developers → API keys → copy the **secret key**.
   In Netlify: *Site configuration → Environment variables* → add `STRIPE_SECRET_KEY`. Redeploy.
   - Start with the `sk_test_…` key and pay with card `4242 4242 4242 4242` to try it end to end,
     then swap in the `sk_live_…` key.
   - In Stripe → Settings → Emails, turn on *Successful payments* for customers and team notifications for Angel.
4. **Domain**: Netlify → *Domain management* → add `aestydesign.ca` and follow the DNS steps.
   HTTPS is automatic.

Later, for markets: Stripe sells card readers (and supports tap-to-pay on phones in some
setups) on the same account, so in-person and online sales land in one place. Square is the
other common choice for markets. Either works alongside this site.

## Everyday edits (all in `site/js/products.js`)

- **Sold something?** Add `sold: true` to it. It stays on the page marked *Sold*.
- **Have several of a piece?** Add `stock: 3` (default is 1).
- **New piece:** copy a line, change `id`, name, price, photo path; put the photo in `site/assets/`.
- **Change featured pieces:** edit `FEATURED`.
- **Shipping price:** `SHIPPING_CAD`.

## Still to confirm

- `SHIPPING_CAD` is set to **$12** as a placeholder. Check it against a real Canada Post rate.
- Stock: two people could buy the same one-of-a-kind piece within minutes of each other. Mark
  pieces `sold: true` promptly; if it does happen, Stripe refunds are one click.
- Sales tax: not charged. Businesses under $30,000/yr in sales don't have to register for HST.
  Stripe Tax can be switched on later if needed.
- The hero photo is the Halloween dish. After October, change `hero-halloween-dish.jpg` in
  `site/index.html` to `hero-amazonite-leaf.jpg` (both are in `assets/`).
- The site's links use `aestydesign.ca`; update the tags in `site/index.html`, `robots.txt` and
  `sitemap.xml` if the domain is different.

## Running locally

```
cd site && python3 -m http.server 8000
```

Everything works except the forms and card checkout, which need Netlify. To test those locally, use
`npx netlify dev` from the repo root.
