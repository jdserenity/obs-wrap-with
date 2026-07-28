# Wrap With

Obsidian plugin: wrap the editor selection in HTML `<b>`, `<em>`, `<s>`, `<u>`, or a color span.

## Setup

```bash
npm install
```

## Commands

```bash
npm test              # unit tests
npm run build         # typecheck + bundle → dist/main.js
npm run dev           # esbuild watch (no typecheck)
./push_to_prod  # build, then copy dist/main.js + manifest.json into the desktop and iOS vault plugin folders
```

After `push_to_prod` (or a manual copy into `.obsidian/plugins/wrap-with/`), reload the plugin in Obsidian.

## Usage

| Action | Default hotkey |
|---|---|
| Bold `<b>` | Mod+Shift+B |
| Italic `<em>` | Mod+Shift+E (also Mod+Shift+I unless turned off in settings) |
| Strikethrough `<s>` | Mod+Shift+S |
| Underline `<u>` | Mod+Shift+U |
| Color span | Mod+Shift+C |
| Remove color spans | Mod+Shift+X |

Colors are edited under the plugin settings. Each vault keeps its own settings (desktop and phone do not sync automatically).

## Docs

- `scaffold/CODEMAP-HUMAN.md` — codebase map (files, flows, where state lives)
- `scaffold/CODEMAP-LLM.md` — product/system reference for agents
