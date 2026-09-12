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

export const DEFAULT_COLORS = ["#c00000", "#ff6600", "#ffc000", "#00b050", "#00b0f0", "#0070c0", "#7030a0"];

export const COLOR_COMMAND = {
  id: "wrap-with-color",
  name: "Wrap selection with next color",
  icon: "palette",
} as const;

export const OPEN_COLOR_PALETTE_COMMAND = {
  id: "wrap-with-open-color-palette",
  name: "Open color palette",
  icon: "palette",
} as const;

export const REMOVE_COLOR_COMMAND = {
  id: "wrap-with-remove-color",
  name: "Remove color from selection",
  icon: "eraser",
} as const;

export const COLOR_HOTKEY: WrapHotkey = { modifiers: ["Mod", "Shift"], key: "c" };
export const OPEN_COLOR_PALETTE_HOTKEY: WrapHotkey = { modifiers: ["Mod", "Shift"], key: "o" };
export const REMOVE_COLOR_HOTKEY: WrapHotkey = { modifiers: ["Mod", "Shift"], key: "x" };

const COLOR_SPAN_OUTER = /^<span style="color:\s*[^"]+">(.*)<\/span>$/s;
const COLOR_SPAN_ANY = /<span style="color:\s*[^"]+">(.*?)<\/span>/gs;

const OUTER_BY_TAG: Record<string, RegExp[]> = {
  b: [/^\*\*(.+)\*\*$/, /^<b>(.+)<\/b>$/s],
  em: [/^\*(.+)\*$/, /^<em>(.+)<\/em>$/s],
  s: [/^~~(.+)~~$/, /^<s>(.+)<\/s>$/s],
  u: [/^<u>(.+)<\/u>$/s],
  color: [COLOR_SPAN_OUTER],
};

/** Convert known markdown forms anywhere inside the text to HTML tags. Order: *** then ** then * then ~~. */
export function convertInnerMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "<b><em>$1</em></b>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>");
}

/** Strip one outer layer matching the mode (markdown and/or HTML), if the whole selection matches. */
export function stripOuterForMode(selection: string, tag: string): string {
  const patterns = OUTER_BY_TAG[tag];
  if (!patterns) return selection;
  for (const re of patterns) {
    const m = selection.match(re);
    if (m) return m[1];
  }
  return selection;
}

/** Strip outer matching mode, then convert remaining markdown wraps to HTML. */
export function prepareSelection(selection: string, tag: string): string {
  return convertInnerMarkdown(stripOuterForMode(selection, tag));
}

export function wrapWithColor(inner: string, hex: string): string {
  return `<span style="color: ${hex}">${inner}</span>`;
}

export function wrapColorSelection(selection: string, hex: string): string | null {
  if (!selection) return null;
  return wrapWithColor(prepareSelection(selection, "color"), hex);
}

export function cursorRetreatForColor(): number {
  return "</span>".length;
}

export function nextColor(colors: string[], index: number): { color: string; nextIndex: number } {
  const n = colors.length;
  const i = ((index % n) + n) % n;
  return { color: colors[i], nextIndex: (i + 1) % n };
}

export type CommandColor = {
  color: string;
  oneShot: boolean;
  nextIndex: number | false;
};

export function commandColor(colors: string[], index: number, lockedColor: string | null | undefined, oneShotColor: string | null | undefined = null): CommandColor {
  if (lockedColor) return { color: lockedColor, oneShot: false, nextIndex: false };
  if (oneShotColor) return { color: oneShotColor, oneShot: true, nextIndex: false };
  return { ...nextColor(colors, index), oneShot: false };
}

export function toggleOneShotColor(currentColor: string | null | undefined, clickedColor: string): string | null {
  return currentColor === clickedColor ? null : clickedColor;
}

/** Unwrap every color span in the text; repeats until stable for nested spans. */
export function removeColorSpans(text: string): string {
  let prev = "";
  let cur = text;
  while (cur !== prev) {
    prev = cur;
    COLOR_SPAN_ANY.lastIndex = 0;
    cur = cur.replace(COLOR_SPAN_ANY, "$1");
  }
  return cur;
}
