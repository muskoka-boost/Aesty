# Placeholders to fill in

Everything below is marked in the HTML with a `data-todo="..."` attribute, so you can find
them with a search. Real content (business name, product names, stones, properties, location)
is already in place — only these are stand-ins.

| `data-todo` value | What it needs | Where |
|---|---|---|
| `instagram-url` | Instagram profile URL | all 5 versions, footer + contact section |
| `facebook-url` | Facebook page / Marketplace URL | all 5 versions, footer + contact section |
| `email` | Enquiry email address (use `mailto:...`) | all 5 versions, footer |
| `enquire-link` | Where "Enquire / Ask about this" should go — probably the Instagram DM link | both product blocks, all 5 versions |
| `market-schedule` | Real market names and dates | contact section, all 5 versions |

Find them all at once:

```
grep -rn 'data-todo' v1 v2 v3 v4 v5
```

## Other things still open

- **Pricing** — deliberately left off every version, since no prices were given. If you want
  prices shown, they slot in under the stone list on each product block.
- **About copy** — the "small table in Orillia" paragraphs are written as a placeholder in the
  right tone and length. Swap in the maker's own words; look for the
  `<!-- TODO: replace with the maker's own words -->` comment in each version.
- **More products** — each version handles 2 pieces now. V2, V4 and V5 take more pieces with no
  layout changes (they're grids). V1 and V3 alternate left/right, so new pieces just continue
  the pattern.
- **Logo file** — the supplied logo was a JPG on white. `assets/logo.png` and
  `assets/logo-light.png` are transparent versions generated from it. If an original vector
  (SVG/AI/EPS) exists, drop it in and it'll look sharper at large sizes.
