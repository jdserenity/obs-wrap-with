import { describe, expect, it, vi } from "vitest";
import { colorAfterArrowKey, colorPopupPosition, preserveEditorSelection } from "./colorPopup";

describe("colorPopupPosition", () => {
  it("places the popup directly above the status bar item", () => {
    expect(colorPopupPosition(
      { left: 900, right: 940, top: 700 },
      { width: 240, height: 160 },
      { width: 1000, height: 800 }
    )).toEqual({ left: 700, top: 532 });
  });

  it("keeps the popup inside the viewport", () => {
    expect(colorPopupPosition(
      { left: 4, right: 44, top: 100 },
      { width: 240, height: 160 },
      { width: 300, height: 200 }
    )).toEqual({ left: 8, top: 8 });
  });
});

describe("preserveEditorSelection", () => {
  it("prevents a pointer press from moving focus out of the editor", () => {
    const preventDefault = vi.fn();
    preserveEditorSelection({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
  });
});

describe("colorAfterArrowKey", () => {
  const colors = ["#a", "#b", "#c"];

  it("moves forward with Right or Down and wraps", () => {
    expect(colorAfterArrowKey(colors, "#a", "ArrowRight")).toBe("#b");
    expect(colorAfterArrowKey(colors, "#c", "ArrowDown")).toBe("#a");
  });

  it("moves backward with Left or Up and wraps", () => {
    expect(colorAfterArrowKey(colors, "#b", "ArrowLeft")).toBe("#a");
    expect(colorAfterArrowKey(colors, "#a", "ArrowUp")).toBe("#c");
  });

  it("ignores unrelated keys", () => {
    expect(colorAfterArrowKey(colors, "#a", "Enter")).toBeNull();
  });
});
