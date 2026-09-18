# Aesty Design — website concepts

Five design directions for **Aesty Design**, a handmade crystal and beaded jewelry business in
Orillia, Ontario. This is a showcase build, not a shop — no checkout yet.

## Viewing

Open `index.html` locally, or browse the published site (see **Deploying** below). The landing
page previews and links to all five versions.

| | Version | Direction |
|---|---|---|
| 01 | [`v1/`](v1/) | **Editorial** — bone white, light serif, hairline rules, lots of air |
| 02 | [`v2/`](v2/) | **Warm Artisan** — sand and clay, arched photos, rounded and friendly |
| 03 | [`v3/`](v3/) | **Dark Luxe** — near-black, gold rules, glow behind each piece |
| 04 | [`v4/`](v4/) | **Soft Modern** — sage and mist, rounded cards, most shop-ready |
| 05 | [`v5/`](v5/) | **Gallery** — black on white, museum labels, enormous photos |

## Structure

```
index.html          chooser page linking to all five
assets/             logo variants, product photos and crops (shared by every version)
v1/ … v5/           one index.html + style.css per version
TODO.md             every placeholder still to be filled in
```

Plain HTML and CSS — no build step, no dependencies, no framework. Fonts load from Google Fonts;
everything else is local. Each version is fully self-contained apart from the shared `assets/`
folder, so the four that don't get picked can simply be deleted.

## Deploying to GitHub Pages

1. Repo **Settings → Pages**
2. **Source**: *Deploy from a branch*
3. **Branch**: the branch holding this code, folder `/ (root)`
4. Save. The site appears at `https://<owner>.github.io/<repo>/` after a minute or two.

`.nojekyll` is committed so GitHub Pages serves the files as-is.

## Content notes

- All copy, product names, stone names and properties are the real details supplied by the
  business. Social links, market dates and pricing are placeholders — see [`TODO.md`](TODO.md).
- Every version is responsive and works down to phone width.
- Product photos are the originals plus square and wide crops generated from them, so the
  different layouts all have a sensible aspect ratio to use.

## Regenerating the chooser thumbnails

`assets/preview-v*.jpg` are 1440×900 screenshots of each version's hero, used by the chooser
page. If you change a version's design, retake that screenshot at 1440×900 and resize it to
880×550 so the card keeps its 16:10 box.
