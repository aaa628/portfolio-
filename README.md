# aaa628 — Portfolio

A static, single-page portfolio site: HTML, CSS and vanilla JavaScript. No build step and no dependencies.

The layout follows a "Welcome to my Portfolio" reference design: a grey grid with crosshair marks, flipping wide type over a red bar, and a fan of cards spinning around a dashed ring. It has two themes:

- **Light** (default): grey + red-orange, as in the reference
- **Dark**: matte near-black + cyan (toggle in the header; the choice is remembered)

## Fonts

Archivo and JetBrains Mono (SIL Open Font License, latin subset) are embedded in `index.html` as base64, so they load anywhere, including in htmlpreview.github.io and on networks that block raw.githubusercontent.com.

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
| `assets/favicon.svg` | Site icon (the fish logo) |

## Profile-card avatars

The X and Discord hover cards show `assets/avatar-x.jpg` and `assets/avatar-discord.jpg` when those files exist (square images, about 200 × 200 px, cropped to a circle automatically). Without them the cards fall back to the fish logo. To use an image hosted elsewhere, change the `src` of the `<img>` inside each `.pcard__avatar` in `index.html`.

## Placeholders to replace

Search `index.html` for `TODO`:

- **`TODO(links)`**: the Flare AI live site, source code and demo video buttons (`data-todo="flare-…"`), plus email, GitHub and LinkedIn in Contact
- **`TODO(photo)`**: the "Me" card in the wheel. Replace its contents with `<img src="assets/portrait.jpg" alt="…">` (both copies, `--i:2` and `--i:9`)

## Pop-ups

Any link to `#name` opens the pop-up `<dialog id="m-name">` instead of scrolling: the wheel cards, the index list and the menu all use this. To add a section, copy one `<dialog class="modal">` block and give it a new `m-…` id.

## Editing the wheel

The ring holds 15 cards: 5 real links (Projects, Me, Capabilities, Research, Contact), then the same 5 repeated twice (`aria-hidden`) to fill the circle. Each card's `style="--i:N"` sets its position and `--n` on `.wheel__spin` is the total. If you change a card, change its repeats too. `data-label` is the text shown under the ▲ pointer when that card is at the top.

## Projects

The Projects card opens `m-projects`, an index of every project. Each row opens that project's own pop-up (`m-flare`, `m-studio`, `m-project-0`, `m-himonide`, `m-avionics`, `m-ai-lab`), which has a "← Projects" button back to the index. To add a project, add a row to the index and copy one project `<dialog>`.

Motion respects the visitor's "reduce motion" setting: auto-spin, the letter flip and the marquee all stop.
