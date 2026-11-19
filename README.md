# AAA628 — Portfolio

A static, single-page portfolio site: HTML, CSS and vanilla JavaScript. No build step and no dependencies.

The layout follows a "Welcome to my Portfolio" reference design: a grey grid with crosshair marks, flipping wide type over a red bar, and a fan of cards spinning around a dashed ring. It has two themes:

- **Light** (default): grey + red-orange, as in the reference
- **Dark**: matte near-black + cyan (toggle in the header; the choice is remembered)

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Any static host works: GitHub Pages (Settings → Pages → deploy from branch, root folder), Netlify (drag the folder in) or Vercel.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | All content and the shared SVG artwork (sprite at the top of `<body>`) |
| `css/style.css` | Design tokens (both themes), layout, cards, responsive rules |
| `js/main.js` | Flipping title, card wheel (auto-spin, drag, scroll), theme toggle, menu, reveal-on-scroll |
| `assets/favicon.svg` | Site icon (the 628 orbit emblem) |

## Placeholders to replace

Search `index.html` for `TODO`:

- **`TODO(name)`**: "Your Name" in the `<title>`, the meta tags, the hero, the About facts and the footer
- **`TODO(links)`**: the Flare AI live site, source code and demo video buttons (`data-todo="flare-…"`), plus email, GitHub and LinkedIn in Contact
- **`TODO(photo)`**: the "Me" card in the wheel. Replace its contents with `<img src="assets/portrait.jpg" alt="…">` (both copies, `--i:2` and `--i:9`)

## Editing the wheel

The ring holds 14 cards: 7 real links, then the same 7 repeated (`aria-hidden`) to fill the circle. Each card's `style="--i:N"` sets its position. If you change a card, change its repeat too. `data-label` is the text shown under the ▲ pointer when that card is at the top.

Motion respects the visitor's "reduce motion" setting: auto-spin, the letter flip and the marquee all stop.
