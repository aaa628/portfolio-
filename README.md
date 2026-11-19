# aaa628 — Portfolio

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
| `index.html` | Hero, card wheel and index, then one `<dialog>` pop-up per section (`id="m-about"`, `m-flare`, …), plus the shared SVG artwork |
| `css/style.css` | Design tokens (both themes), layout, cards, responsive rules |
| `js/main.js` | Flipping title, card wheel (auto-spin, drag), pop-ups, theme toggle, menu |
| `assets/favicon.svg` | Site icon (the 628 orbit emblem) |
| `assets/fonts/` | Self-hosted Archivo and JetBrains Mono (SIL Open Font License), so the site works without Google Fonts |

## Placeholders to replace

Search `index.html` for `TODO`:

- **`TODO(links)`**: the Flare AI live site, source code and demo video buttons (`data-todo="flare-…"`), plus email, GitHub and LinkedIn in Contact
- **`TODO(photo)`**: the "Me" card in the wheel. Replace its contents with `<img src="assets/portrait.jpg" alt="…">` (both copies, `--i:2` and `--i:9`)

## Pop-ups

Any link to `#name` opens the pop-up `<dialog id="m-name">` instead of scrolling: the wheel cards, the index list and the menu all use this. Links can be shared too: `yoursite/#flare` opens straight into Flare AI. To add a section, copy one `<dialog class="modal">` block and give it a new `m-…` id.

## Editing the wheel

The ring holds 14 cards: 7 real links, then the same 7 repeated (`aria-hidden`) to fill the circle. Each card's `style="--i:N"` sets its position. If you change a card, change its repeat too. `data-label` is the text shown under the ▲ pointer when that card is at the top.

Motion respects the visitor's "reduce motion" setting: auto-spin, the letter flip and the marquee all stop.
