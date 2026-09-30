import { PRODUCTS, COLOURS, TYPES, FEATURED, SHIPPING_CAD, stockOf } from './products.js';
import { FORM_ENDPOINT, CHECKOUT_ENDPOINT, PHONE, PHONE_LABEL } from './config.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const money = n => '$' + n.toFixed(2).replace(/\.00$/, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pos = p => (p.type === 'Bracelets' ? '50% 68%' : '50% 58%');
const SWATCH = { Orange: '#E8853A', Red: '#A8322E', Pink: '#EBB7B7', Yellow: '#E5C96A', Green: '#8FBFA8', Purple: '#9C7FBF', Brown: '#8B5E3C', Neutral: '#EDE6D8', 'Black & grey': '#3A3A3A' };
const SCREENS = ['home', 'shop', 'custom', 'contact'];
const CART_KEY = 'aesty-bag';

const state = { type: 'All', colour: 'All', fulfil: 'pickup', pay: 'card', view: 'list' };

// ---- Bag (kept in localStorage so it survives the Stripe round trip) ----
let cart = load();
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return raw.filter(c => byId[c.id] && stockOf(byId[c.id]) > 0)
              .map(c => ({ id: c.id, qty: Math.min(c.qty, stockOf(byId[c.id])) }));
  } catch { return []; }
}
function save() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} }
const qtyOf = id => cart.find(c => c.id === id)?.qty || 0;
const subtotal = () => cart.reduce((a, c) => a + byId[c.id].price * c.qty, 0);

function add(id) {
  const p = byId[id];
  if (qtyOf(id) >= stockOf(p)) { toast(stockOf(p) ? p.name + ' is already in your bag' : p.name + ' has sold'); return; }
  const line = cart.find(c => c.id === id);
  if (line) line.qty++; else cart.push({ id, qty: 1 });
  save(); renderBag(); toast(p.name + ' added to your bag');
}
function changeQty(id, d) {
  cart = cart.map(c => (c.id === id ? { ...c, qty: Math.min(c.qty + d, stockOf(byId[id])) } : c)).filter(c => c.qty > 0);
  save(); renderBag();
}

// ---- Routing ----
function go(screen, { scroll = true } = {}) {
  if (!SCREENS.includes(screen)) screen = 'home';
  $$('[data-screen]').forEach(el => { el.hidden = el.dataset.screen !== screen; });
  $$('.links a').forEach(a => {
    if (a.dataset.go === screen) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const label = $(`[data-screen="${screen}"]`).dataset.label;
  document.title = screen === 'home' ? 'Aesty Design — Handmade crystal jewellery, Orillia' : `${label} — Aesty Design`;
  if (scroll) window.scrollTo(0, 0);
  if (location.hash.slice(1) !== screen) history.replaceState(null, '', location.pathname + location.search + '#' + screen);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]');
  if (!a) return;
  e.preventDefault();
  closeCart();
  go(a.dataset.go);
});
window.addEventListener('hashchange', () => go(location.hash.slice(1)));

// ---- Product cards ----
function card(p, { showType }) {
  const left = stockOf(p);
  const tag = left === 0 ? '<span class="prod-tag sold">Sold</span>' : showType ? `<span class="prod-tag">${esc(p.type)}</span>` : '';
  return `<article class="prod${left ? '' : ' is-sold'}">
    <button class="prod-img" type="button" data-add="${p.id}" aria-label="Add ${esc(p.name)} to bag"${left ? '' : ' disabled'}>
      <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" width="1104" height="1962" style="object-position:${pos(p)}">${tag}
    </button>
    <div class="prod-top"><h3>${esc(p.name)}</h3><span class="price">${money(p.price)}</span></div>
    ${showType ? '' : `<p class="tier">${esc(p.tier)}</p>`}
    <p class="desc">${esc(p.desc)}</p>
    <button class="btn btn-line" type="button" data-add="${p.id}"${left ? '' : ' disabled'}>${left ? 'Add to bag' : 'Sold'}</button>
  </article>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-add]');
  if (b && !b.disabled) add(b.dataset.add);
});

function chip(label, pressed, attrs = '', inner = esc(label)) {
  return `<button class="chip" type="button" aria-pressed="${pressed}" ${attrs}>${inner}</button>`;
}

function renderShop() {
  const list = PRODUCTS.filter(p => (state.type === 'All' || p.type === state.type) && (state.colour === 'All' || p.colours.includes(state.colour)));
  $('[data-products]').innerHTML = list.map(p => card(p, { showType: false })).join('');
  $('[data-no-results]').hidden = list.length > 0;
  $('[data-result-label]').textContent = list.length + (list.length === 1 ? ' piece' : ' pieces');
  $('[data-type-chips]').innerHTML = TYPES.map(t => chip(t, state.type === t, `data-type="${esc(t)}"`)).join('');
  $('[data-colour-chips]').innerHTML = COLOURS.map(c => chip(c, state.colour === c, `data-colour="${esc(c)}"`,
    (c === 'All' ? '' : `<span class="sw" style="background:${SWATCH[c]}"></span>`) + esc(c))).join('');
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-type]'), c = e.target.closest('[data-colour]');
  if (t) { state.type = t.dataset.type; renderShop(); }
  if (c) { state.colour = c.dataset.colour; renderShop(); }
});

// ---- Custom order form ----
function initChoices(form) {
  $$('[data-choice]', form).forEach(group => {
    const input = form.elements[group.dataset.choice];
    const draw = () => { group.innerHTML = group.dataset.options.split('|').map(o => chip(o, input.value === o, `data-value="${esc(o)}"`)).join(''); };
    group.addEventListener('click', e => { const b = e.target.closest('[data-value]'); if (b) { input.value = b.dataset.value; draw(); } });
    draw();
  });
}

async function postForm(form) {
  const res = FORM_ENDPOINT
    // Formspree (or any service that accepts a plain form post)
    ? await fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
    // Netlify Forms: POST the url-encoded fields to any static path on the site.
    : await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    });
  if (!res.ok) throw new Error('Form post failed: ' + res.status);
}

// Error line with a pre-filled text message to Angel, so an order is never lost to a failed post.
function showError(el, message, smsBody) {
  const link = document.createElement('a');
  link.className = 'under-link';
  link.href = `sms:${PHONE}?&body=${encodeURIComponent(smsBody)}`;
  link.textContent = 'Text it to Angel instead';
  el.replaceChildren(message + ' ', link, ` or call ${PHONE_LABEL}.`);
  el.hidden = false;
}

const customForm = $('[data-custom-form]');
initChoices(customForm);
customForm.addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('[data-error]', customForm), btn = $('button[type=submit]', customForm);
  err.hidden = true; btn.disabled = true;
  try {
    await postForm(customForm);
    customForm.hidden = true;
    const sent = $('[data-custom-sent]'); sent.hidden = false; sent.focus();
    window.scrollTo(0, 0);
  } catch {
    const f = customForm.elements;
    showError(err, "That didn't go through.",
      `Hi Angel, custom request from ${f.name.value} (${f.contact.value}): ${f.piece.value}, ${f.metal.value}. `
      + `Stones/colours: ${f.stones.value || '-'}. Budget: ${f.budget.value}. ${f.notes.value}`);
  } finally { btn.disabled = false; }
});
$('[data-custom-reset]').addEventListener('click', () => {
  customForm.reset(); customForm.elements.piece.value = 'Bracelet'; customForm.elements.metal.value = 'Gold';
  initChoices(customForm);
  customForm.hidden = false; $('[data-custom-sent]').hidden = true;
});

// ---- Bag drawer ----
const drawer = $('[data-drawer]'), scrim = $('.scrim'), orderForm = $('[data-order-form]');
let lastFocus = null;

function openCart() {
  lastFocus = document.activeElement;
  drawer.hidden = scrim.hidden = false;
  $('[data-toast]').hidden = true;
  document.body.classList.add('locked');
  renderBag();
  $('.close', drawer).focus();
}
function closeCart() {
  if (drawer.hidden) return;
  drawer.hidden = scrim.hidden = true;
  document.body.classList.remove('locked');
  if (state.view === 'done') state.view = 'list';
  lastFocus?.focus?.();
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-open-cart]')) openCart();
  else if (e.target.closest('[data-close-cart]')) closeCart();
  else if (e.target.closest('[data-close-shop]')) { closeCart(); go('shop'); }
  else if (e.target.closest('[data-close-home]')) { closeCart(); go('home'); }
  else if (e.target.closest('[data-start-checkout]')) { state.view = 'form'; renderBag(); $('#oname').focus(); }
  else if (e.target.closest('[data-back-to-bag]')) { state.view = 'list'; renderBag(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
  if (e.key === 'Tab' && !drawer.hidden) {
    const f = $$('button:not([disabled]), input:not([type=hidden]):not([tabindex="-1"]), a[href]', drawer).filter(el => el.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  }
});

function renderBag() {
  const count = cart.reduce((a, c) => a + c.qty, 0);
  $$('[data-cart-count]').forEach(el => { el.textContent = count; });
  $('.bag-btn').setAttribute('aria-label', `Open bag, ${count} item${count === 1 ? '' : 's'}`);
  const view = state.view === 'done' ? 'done' : cart.length === 0 ? 'empty' : state.view;
  $$('[data-view]', drawer).forEach(el => { el.hidden = el.dataset.view !== view; });

  $('[data-cart-items]').innerHTML = cart.map(c => {
    const p = byId[c.id];
    return `<div class="item">
      <div class="item-img"><img src="${p.img}" alt="${esc(p.name)}" style="object-position:${pos(p)}"></div>
      <div class="item-mid">
        <span class="item-name">${esc(p.name)}</span>
        <span class="small muted">${esc(p.tier)}</span>
        <div class="qty">
          <button type="button" data-dec="${p.id}" aria-label="Fewer ${esc(p.name)}">−</button>
          <span>${c.qty}</span>
          <button type="button" data-inc="${p.id}" aria-label="More ${esc(p.name)}"${c.qty >= stockOf(p) ? ' disabled title="That\'s all there is"' : ''}>+</button>
        </div>
      </div>
      <div class="item-end">
        <span>${money(p.price * c.qty)}</span>
        <button class="remove" type="button" data-remove="${p.id}">Remove</button>
      </div>
    </div>`;
  }).join('');

  const isPickup = state.fulfil === 'pickup';
  if (!isPickup) state.pay = 'card';
  const sub = subtotal(), ship = isPickup ? 0 : SHIPPING_CAD;
  $$('[data-subtotal]').forEach(el => { el.textContent = money(sub); });
  $('[data-fulfil-line]').textContent = isPickup ? 'Local pickup' : 'Shipping';
  $('[data-fulfil-cost]').textContent = isPickup ? 'Free' : money(ship);
  $('[data-total]').textContent = money(sub + ship);

  $('[data-fulfil-chips]').innerHTML = [['pickup', 'Local pickup', 'Orillia · free'], ['ship', 'Ship it', `Across Canada · ${money(SHIPPING_CAD)}`]]
    .map(([k, l, s]) => chip(l, state.fulfil === k, `data-fulfil="${k}"`, `<span>${l}</span><small>${s}</small>`)).join('');
  const pays = isPickup ? [['card', 'Card'], ['etransfer', 'E-transfer'], ['cash', 'Cash at pickup']] : [['card', 'Card']];
  $('[data-pay-chips]').innerHTML = pays.map(([k, l]) => chip(l, state.pay === k, `data-pay="${k}"`)).join('');
  $('[data-pay-note]').textContent = {
    card: isPickup ? "You'll pay on Stripe's secure page." : "You'll enter your card and shipping address on Stripe's secure page.",
    etransfer: 'Angel will text you the e-transfer details.',
    cash: 'Pay Angel in person when you pick up.',
  }[state.pay];

  const phone = $('[data-pickup-only]');
  phone.hidden = !isPickup; $('#ophone').required = isPickup;
  $('[data-submit-order]').textContent = state.pay === 'card' ? 'Continue to payment' : 'Place order';
}
drawer.addEventListener('click', e => {
  const t = e.target.closest('[data-inc],[data-dec],[data-remove],[data-fulfil],[data-pay]');
  if (!t) return;
  $('[data-error]', orderForm).hidden = true;
  if (t.dataset.inc) changeQty(t.dataset.inc, 1);
  else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
  else if (t.dataset.remove) changeQty(t.dataset.remove, -Infinity);
  else if (t.dataset.fulfil) { state.fulfil = t.dataset.fulfil; state.pay = 'card'; renderBag(); }
  else if (t.dataset.pay) { state.pay = t.dataset.pay; renderBag(); }
});

function showDone(message, orderNo) {
  cart = []; save();
  state.view = 'done';
  $('[data-done-message]').textContent = message;
  $('[data-order-no]').textContent = orderNo ? 'Order ' + orderNo : '';
  if (drawer.hidden) openCart(); else renderBag();
  $('.bag-done').focus();
}

orderForm.addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('[data-error]', orderForm), btn = $('[data-submit-order]');
  err.hidden = true; btn.disabled = true;
  const f = orderForm.elements;
  try {
    if (state.pay === 'card') {
      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, fulfil: state.fulfil, name: f.name.value, email: f.email.value, phone: f.phone.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Card payment isn't available on the site yet.");
      location.href = data.url; // Stripe-hosted payment page
      return;
    }
    const orderNo = 'AD-' + Math.floor(1000 + Math.random() * 9000);
    f.items.value = cart.map(c => `${c.qty} × ${byId[c.id].name} (${money(byId[c.id].price * c.qty)})`).join('; ') + ` [${orderNo}]`;
    f.total.value = money(subtotal());
    f.fulfilment.value = state.fulfil;
    f.payment.value = state.pay;
    await postForm(orderForm);
    orderForm.reset();
    showDone(state.pay === 'cash'
      ? 'Angel will text you to arrange a pickup time in Orillia. Bring cash when you come.'
      : 'Angel will text you the e-transfer details and a pickup time in Orillia.', orderNo);
  } catch (ex) {
    const lines = cart.map(c => `${c.qty} x ${byId[c.id].name} (${money(byId[c.id].price * c.qty)})`).join(', ');
    const how = state.fulfil === 'ship' ? 'shipped' : 'for pickup in Orillia';
    showError(err, ex.message.startsWith('Form') || ex instanceof TypeError ? "That didn't go through." : ex.message,
      `Hi Angel, I'd like to order ${lines}, ${how}, paying by ${{ card: 'card', etransfer: 'e-transfer', cash: 'cash' }[state.pay]}. `
      + `Name: ${f.name.value}. Email: ${f.email.value}.`);
  } finally { btn.disabled = false; }
});

// ---- Toast ----
let toastTimer;
function toast(text) {
  if (!drawer.hidden) return;
  $('[data-toast-text]').textContent = text;
  $('[data-toast]').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('[data-toast]').hidden = true; }, 2600);
}

// ---- Boot ----
$$('[data-ship-rate]').forEach(el => { el.textContent = money(SHIPPING_CAD); });
$('[data-featured]').innerHTML = FEATURED.map(id => byId[id]).filter(Boolean).map(p => card(p, { showType: true })).join('');
renderShop();
renderBag();
go(location.hash.slice(1) || 'home', { scroll: false });

// Returning from Stripe
const params = new URLSearchParams(location.search);
if (params.has('paid') || params.has('cancelled')) {
  const fulfil = params.get('paid');
  history.replaceState(null, '', location.pathname + location.hash);
  if (fulfil) {
    showDone(fulfil === 'ship'
      ? "Payment received. Angel will email you when it's in the mail."
      : 'Payment received. Angel will text you to arrange a pickup time in Orillia.', params.get('order') || '');
  } else {
    openCart();
  }
}
