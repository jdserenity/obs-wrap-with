/** Strip outer markdown when the whole selection matches (same behavior as the original single-tag plugins). */
export function innerFromSelection(selection: string, outerMarkdown: RegExp): string {
  return selection.replace(outerMarkdown, "$1");
}

export function wrapWithTag(inner: string, tag: string): string {
  return `<${tag}>${inner}</${tag}>`;
}

/** Cursor moves back by closing tag length so the caret lands inside the new tags when selection was empty. */
export function cursorRetreatForTag(tag: string): number {
  return `</${tag}>`.length;
}

export const WRAP_MODES = [
  { id: "wrap-with-b", name: "Wrap selection with <b> tags", tag: "b", icon: "bold", outerMarkdown: /^\*\*(.+)\*\*$/ },
  { id: "wrap-with-em", name: "Wrap selection with <em> tags", tag: "em", icon: "italic", outerMarkdown: /^\*(.+)\*$/ },
  { id: "wrap-with-s", name: "Wrap selection with <s> tags", tag: "s", icon: "strikethrough", outerMarkdown: /^~~(.+)~~$/ },
  { id: "wrap-with-u", name: "Wrap selection with <u> tags", tag: "u", icon: "underline", outerMarkdown: /^<u>(.+)<\/u>$/ },
] as const;

export type WrapHotkey = { modifiers: ("Mod" | "Shift")[]; key: string };

export const WRAP_HOTKEYS: Record<(typeof WRAP_MODES)[number]["tag"], WrapHotkey> = {
  b: { modifiers: ["Mod", "Shift"], key: "b" },
  em: { modifiers: ["Mod", "Shift"], key: "e" },
  s: { modifiers: ["Mod", "Shift"], key: "s" },
  u: { modifiers: ["Mod", "Shift"], key: "u" },
};

/** Optional second hotkey for em (default on in plugin settings). */
export const EM_ALT_HOTKEY: WrapHotkey = { modifiers: ["Mod", "Shift"], key: "i" };

export function emCommandHotkeys(alsoModShiftI: boolean): WrapHotkey[] {
  return alsoModShiftI ? [WRAP_HOTKEYS.em, EM_ALT_HOTKEY] : [WRAP_HOTKEYS.em];
}
