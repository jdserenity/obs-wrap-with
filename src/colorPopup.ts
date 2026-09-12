export type PopupAnchorRect = { left: number; right: number; top: number };
export type PopupSize = { width: number; height: number };
export type ViewportSize = { width: number; height: number };

export function colorAfterArrowKey(colors: string[], currentColor: string, key: string): string | null {
  if (!colors.length) return null;
  const direction = key === "ArrowRight" || key === "ArrowDown" ? 1 : key === "ArrowLeft" || key === "ArrowUp" ? -1 : 0;
  if (!direction) return null;
  const currentIndex = Math.max(0, colors.indexOf(currentColor));
  return colors[(currentIndex + direction + colors.length) % colors.length];
}

export function colorPopupPosition(anchor: PopupAnchorRect, popup: PopupSize, viewport: ViewportSize, gap = 8, padding = 8): { left: number; top: number } {
  const maxLeft = Math.max(padding, viewport.width - popup.width - padding);
  const maxTop = Math.max(padding, viewport.height - popup.height - padding);
  return {
    left: Math.min(Math.max(anchor.right - popup.width, padding), maxLeft),
    top: Math.min(Math.max(anchor.top - popup.height - gap, padding), maxTop),
  };
}

/** Keep status-bar and popup pointer presses from moving focus out of the editor. */
export function preserveEditorSelection(event: Pick<Event, "preventDefault">): void {
  event.preventDefault();
}
