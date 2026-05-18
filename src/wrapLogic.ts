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
  { id: "wrap-with-b", name: "Wrap selection with <b> tags", tag: "b", outerMarkdown: /^\*\*(.+)\*\*$/ },
  { id: "wrap-with-em", name: "Wrap selection with <em> tags", tag: "em", outerMarkdown: /^\*(.+)\*$/ },
  { id: "wrap-with-s", name: "Wrap selection with <s> tags", tag: "s", outerMarkdown: /^~~(.+)~~$/ },
] as const;
