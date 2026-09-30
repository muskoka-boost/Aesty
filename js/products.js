// The catalogue. This one file drives the shop page AND the prices charged at checkout
// (netlify/functions/checkout.mjs imports it), so a price changed here is changed everywhere.
//
// Per product:
//   price  whole Canadian dollars
//   stock  how many are available (optional, defaults to 1 because most pieces are one of a kind)
//   sold   set to true once a piece has sold; it stays on the page marked "Sold"
//   colours / type drive the shop filters
export const PRODUCTS = [
  { id: 'honey-pot', name: 'Honey Pot', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Orange', 'Yellow'], img: 'assets/earrings-honey-pot.jpg', desc: 'Little enamel honey pots with a bee, on gold-plated hooks.' },
  { id: 'pumpkin-truck', name: 'Pumpkin Truck', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Green', 'Orange'], img: 'assets/earrings-pumpkin-truck.jpg', desc: 'Mint vintage pickups with a bed full of pumpkins.' },
  { id: 'jam-jar', name: 'Jam Jar', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Red'], img: 'assets/earrings-jam-jar.jpg', desc: 'Deep red preserves with a tiny bow, on gold-plated hooks.' },
  { id: 'toadstool', name: 'Toadstool', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Red', 'Pink'], img: 'assets/earrings-toadstool.jpg', desc: 'Red-capped mushrooms with pink stems and autumn leaves.' },
  { id: 'mushroom', name: 'Spotted Mushroom', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Orange'], img: 'assets/earrings-mushroom-orange.jpg', desc: 'Orange caps with gold spots.' },
  { id: 'squirrel', name: 'Red Squirrel', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Orange', 'Brown'], img: 'assets/earrings-squirrel.jpg', desc: 'A squirrel holding its acorn, in warm enamel.' },
  { id: 'butternut', name: 'Butternut', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Orange'], img: 'assets/earrings-butternut.jpg', desc: 'Squash slices with a scalloped gold edge.' },
  { id: 'pumpkin-latte', name: 'Pumpkin Latte', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Green', 'Orange'], img: 'assets/earrings-pumpkin-latte.jpg', desc: 'A to-go cup with a pumpkin on the sleeve.' },
  { id: 'pumpkin', name: 'Little Pumpkin', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Orange'], img: 'assets/earrings-pumpkin.jpg', desc: 'Classic orange pumpkins with a green stem.' },
  { id: 'pumpkin-teapot', name: 'Pumpkin Teapot', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Orange'], img: 'assets/earrings-pumpkin-teapot.jpg', desc: 'Glossy pumpkin teapots, ready to pour.' },
  { id: 'melon-slice', name: 'Melon Slice', type: 'Earrings', tier: 'Charm earrings', price: 10, colours: ['Orange'], img: 'assets/earrings-melon-slice.jpg', desc: 'Bright cantaloupe wedges with gold seeds.' },
  { id: 'amazonite-trio', name: 'Amazonite Trio', type: 'Earrings', tier: 'Medium crystal earrings', price: 20, colours: ['Green', 'Neutral'], img: 'assets/earrings-amazonite-trio.jpg', desc: 'Amazonite, kiwi jasper and rose quartz stacked on sterling silver.', stones: 'Amazonite · Kiwi jasper · Rose quartz' },
  { id: 'unakite-drops', name: 'Unakite Drops', type: 'Earrings', tier: 'Premium crystal earrings', price: 28, colours: ['Green', 'Brown'], img: 'assets/earrings-unakite-drops.jpg', desc: 'Five unakite beads separated by sterling silver coils.', stones: 'Unakite · Sterling silver' },
  { id: 'labradorite-drops', name: 'Labradorite Drops', type: 'Earrings', tier: 'Premium crystal earrings', price: 28, colours: ['Black & grey'], img: 'assets/earrings-labradorite-drops.jpg', desc: 'Long drops of flashing labradorite and sterling silver.', stones: 'Labradorite · Sterling silver' },
  { id: 'dalmatian', name: 'Dalmatian Jasper', type: 'Bracelets', tier: 'Crystal bracelet', price: 22, colours: ['Black & grey', 'Neutral'], img: 'assets/bracelet-dalmatian-jasper.jpg', desc: 'Speckled dalmatian jasper alternating with black onyx.', stones: 'Dalmatian jasper · Onyx' },
  { id: 'carnelian', name: 'Carnelian', type: 'Bracelets', tier: 'Crystal bracelet', price: 22, colours: ['Red', 'Orange'], img: 'assets/bracelet-carnelian.jpg', desc: 'Warm, translucent carnelian in a simple strand.', stones: 'Carnelian' },
  { id: 'amethyst-gold', name: 'Amethyst & Gold', type: 'Bracelets', tier: 'Premium crystal bracelet', price: 26, colours: ['Purple'], img: 'assets/bracelet-amethyst-gold.jpg', desc: 'Amethyst and lavender chalcedony with gold-plated spacers.', stones: 'Amethyst · Chalcedony · Gold plate' },
  { id: 'yellow-turquoise', name: 'Yellow Turquoise', type: 'Bracelets', tier: 'Crystal bracelet', price: 22, colours: ['Green', 'Yellow'], img: 'assets/bracelet-yellow-turquoise.jpg', desc: 'Mossy yellow turquoise with dark matrix.', stones: 'Yellow turquoise' },
  { id: 'mahogany', name: 'Mahogany Obsidian', type: 'Bracelets', tier: 'Crystal bracelet', price: 22, colours: ['Brown', 'Black & grey'], img: 'assets/bracelet-mahogany-obsidian.jpg', desc: 'Mahogany obsidian with matte black lava stone.', stones: 'Mahogany obsidian · Lava stone' },
  { id: 'yellow-jade', name: 'Sunny Jade', type: 'Bracelets', tier: 'Premium crystal bracelet', price: 26, colours: ['Yellow', 'Neutral'], img: 'assets/bracelet-yellow-jade-charm.jpg', desc: 'Yellow jade, white lava stone and gold discs with a shell charm.', stones: 'Yellow jade · Lava stone · Gold plate' },
  { id: 'amazonite-charm', name: 'Amazonite & Lava', type: 'Bracelets', tier: 'Premium crystal bracelet', price: 26, colours: ['Green', 'Neutral'], img: 'assets/bracelet-amazonite-charm.jpg', desc: 'Sea-green amazonite and white lava with a gold-rimmed charm.', stones: 'Amazonite · Lava stone · Gold plate' },
  { id: 'wood-jasper', name: 'Wood Jasper', type: 'Bracelets', tier: 'Crystal bracelet', price: 22, colours: ['Brown', 'Neutral'], img: 'assets/bracelet-wood-jasper.jpg', desc: 'Grainy, earthy wood jasper in a single strand.', stones: 'Wood jasper' },
  { id: 'indian-agate', name: 'Indian Agate', type: 'Bracelets', tier: 'Crystal bracelet', price: 22, colours: ['Green', 'Red', 'Purple'], img: 'assets/bracelet-indian-agate.jpg', desc: 'Forest greens and wine reds, every bead different.', stones: 'Indian agate' },
  { id: 'lavender-star', name: 'Lavender Star', type: 'Bracelets', tier: 'Premium crystal bracelet', price: 26, colours: ['Purple', 'Neutral'], img: 'assets/bracelet-lavender-star.jpg', desc: 'Lavender chalcedony and white lava with a gold star charm.', stones: 'Chalcedony · Lava stone · Gold plate' },
];

export const COLOURS = ['All', 'Orange', 'Red', 'Pink', 'Yellow', 'Green', 'Purple', 'Brown', 'Neutral', 'Black & grey'];
export const TYPES = ['All', 'Earrings', 'Bracelets'];
export const FEATURED = ['amazonite-trio', 'amethyst-gold', 'pumpkin-truck', 'lavender-star', 'labradorite-drops', 'carnelian'];

// Flat shipping charged on shipped orders, in Canadian dollars. Pickup is always free.
// TODO(owner): confirm against a real Canada Post rate for a padded mailer.
export const SHIPPING_CAD = 12;

export const stockOf = p => (p.sold ? 0 : (p.stock ?? 1));
