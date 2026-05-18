# Architecture

## Purpose

Single Obsidian plugin **Wrap With** replaces three separate plugins that wrapped the editor selection in HTML `<b>`, `<em>`, or `<s>` after optionally stripping one outer layer of matching Markdown (`**…**`, `*…*`, `~~…~~`).

## Layout

- `src/wrapLogic.ts` — pure helpers + `WRAP_MODES` table (tag, command id/name, strip regex).
- `src/main.ts` — `Plugin` wiring: one `addCommand` per mode, shared `applyWrap` editor callback.
- `esbuild.config.mjs` — bundle `src/main.ts` to root `main.js` with `obsidian` externalized.

## Defaults

- Command IDs: `wrap-with-b`, `wrap-with-em`, `wrap-with-s` (stable for hotkey/settings migration from the old plugins).
- Default hotkeys: Cmd+Shift+B / Cmd+Shift+E / Cmd+Shift+S (Mod+Shift on non-macOS).

## Build / test

- `npm run build` — `tsc --noEmit` then esbuild production bundle.
- `npm test` — Vitest on `src/wrapLogic.test.ts` (strip/wrap/cursor offset helpers).
