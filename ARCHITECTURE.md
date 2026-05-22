# Architecture

## Purpose

Single Obsidian plugin **Wrap With** wraps the editor selection in HTML `<b>`, `<em>`, `<s>`, or `<u>` after optionally stripping one outer layer of matching markup (`**…**`, `*…*`, `~~…~~`, or `<u>…</u>`).

## Layout

- `src/wrapLogic.ts` — pure helpers + `WRAP_MODES` table (tag, command id/name, Lucide icon id, strip regex).
- `src/main.ts` — `Plugin` wiring: one `addCommand` per mode (with `icon` for mobile toolbar), shared `applyWrap` editor callback.
- `esbuild.config.mjs` — bundle `src/main.ts` to root `main.js` with `obsidian` externalized.

## Defaults

- Command IDs: `wrap-with-b`, `wrap-with-em`, `wrap-with-s`, `wrap-with-u` (stable for hotkey/settings migration from the old plugins).
- Default hotkeys: Mod+Shift+B / E / S / U.
- Mobile: each command sets `icon` (`bold`, `italic`, `strikethrough`, `underline`) so they appear in Obsidian mobile toolbar customization (Settings → Mobile → Manage toolbar options).

## Build / test

- `npm run build` — `tsc --noEmit` then esbuild production bundle.
- `npm test` — Vitest on `src/wrapLogic.test.ts` (strip/wrap/cursor offset helpers).
