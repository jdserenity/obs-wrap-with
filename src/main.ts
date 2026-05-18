import { Editor, Plugin } from "obsidian";
import { WRAP_MODES, cursorRetreatForTag, innerFromSelection, wrapWithTag } from "./wrapLogic";

function applyWrap(editor: Editor, tag: string, outerMarkdown: RegExp): void {
  const selection = editor.getSelection();
  const inner = innerFromSelection(selection, outerMarkdown);
  editor.replaceSelection(wrapWithTag(inner, tag));
  if (!selection) {
    const cursor = editor.getCursor();
    editor.setCursor({ line: cursor.line, ch: cursor.ch - cursorRetreatForTag(tag) });
  }
}

const HOTKEYS: Record<(typeof WRAP_MODES)[number]["tag"], { modifiers: ("Mod" | "Shift")[]; key: string }> = {
  b: { modifiers: ["Mod", "Shift"], key: "b" },
  em: { modifiers: ["Mod", "Shift"], key: "e" },
  s: { modifiers: ["Mod", "Shift"], key: "s" },
};

export default class WrapWithPlugin extends Plugin {
  async onload(): Promise<void> {
    for (const mode of WRAP_MODES) {
      this.addCommand({
        id: mode.id,
        name: mode.name,
        hotkeys: [HOTKEYS[mode.tag]],
        editorCallback: (editor) => applyWrap(editor, mode.tag, mode.outerMarkdown),
      });
    }
  }
}
