// Where orders and custom requests are sent. Leave both as they are when hosting on Netlify.
//
// On GitHub Pages (static only) the Netlify pieces don't exist, so:
//   FORM_ENDPOINT      set to a Formspree form URL, e.g. 'https://formspree.io/f/abcdwxyz'
//                      (free account at formspree.io; its emails go to Angel)
//   CHECKOUT_ENDPOINT  card payments need the Netlify function; until then card checkout
//                      falls back to "text your order to Angel".
// If a form can't be sent, customers are offered a pre-filled text message to Angel instead.
export const FORM_ENDPOINT = '';
export const CHECKOUT_ENDPOINT = '/api/checkout';
export const PHONE = '+12498779822';
export const PHONE_LABEL = '(249) 877-9822';
