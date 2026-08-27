# Architecture (agent reference)

## Purpose
Obsidian plugin **Wrap With**: wrap editor selection in HTML `<b>` / `<em>` / `<s>` / `<u>`, or next color span; strip one outer matching layer then convert remaining known markdown wraps to HTML before applying outer wrap. Remove-color unwraps color spans in selection.

## Layout
- `src/wrapLogic.ts` — pure helpers: `WRAP_MODES`, `prepareSelection` (strip outer + `convertInnerMarkdown`), color helpers (`wrapWithColor`, `nextColor`, `commandColor`, `removeColorSpans`, command/hotkey constants, `DEFAULT_COLORS`).
- `src/main.ts` — Plugin: commands per wrap mode + `wrap-with-color` + `wrap-with-remove-color`; status bar color picker/lock modal; settings tab; persist `{ emAlsoModShiftI, colors, nextColorIndex, lockedColor, oneShotColor }`.
- `esbuild.config.mjs` — bundle `src/main.ts` → `dist/main.js` (`obsidian` external).
- `push_to_prod` — build then copy `dist/main.js` + `manifest.json` into desktop and iOS vault plugin folders.

## Apply path
1. If whole selection matches mode outer (markdown and/or HTML for that tag; color = outer `<span style="color:…">`), strip once.
2. Convert anywhere inside: `***`→`<b><em>`, `**`→`<b>`, `*`→`<em>`, `~~`→`<s>`.
3. Wrap with target tag or color span. Color command uses `lockedColor` when set; locked use does not advance `nextColorIndex`. If no color is locked and `oneShotColor` is set, color command uses `oneShotColor` once, clears it, and does not advance `nextColorIndex`; clicking the same one-shot swatch again clears `oneShotColor` back to random before command use. If neither is set, color command uses next color and advances `nextColorIndex` (persisted). Editing or removing the saved swatch that is locked clears `lockedColor`; editing/removing the one-shot swatch clears `oneShotColor`. Remove-color: non-empty selection → `removeColorSpans` only (no index change).

## Commands / defaults
| id | hotkey | icon |
|---|---|---|
| `wrap-with-b` / `em` / `s` / `u` | Mod+Shift+B / E / S / U; em also Mod+Shift+I when `emAlsoModShiftI` | bold / italic / strikethrough / underline |
| `wrap-with-color` | Mod+Shift+C | palette |
| `wrap-with-remove-color` | Mod+Shift+X | eraser |

Color markup: `<span style="color: #RRGGBB">…</span>`. Default palette (7): `#c00000`, `#ff6600`, `#ffc000`, `#00b050`, `#00b0f0`, `#0070c0`, `#7030a0`. Settings: add/remove colors (min 1). Status bar color button is icon-only; the icon is colored for one-shot/locked color and opens a popup with saved color swatches plus lock/unlock. Desktop vs iOS vaults have separate plugin data (no sync).

## Build / test
- `npm run build` — `tsc --noEmit` then esbuild → `dist/main.js`
- `npm test` — Vitest (`src/wrapLogic.test.ts`, `src/pushToProd.test.ts`)
- `npm run push_to_prod` — deploy to `obsidian vault (root)` and iCloud `obsidian vault (ios)` under `.obsidian/plugins/wrap-with`
