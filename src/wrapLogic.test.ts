import { describe, expect, it } from "vitest";
import {
  EM_ALT_HOTKEY,
  OPEN_COLOR_PALETTE_COMMAND,
  OPEN_COLOR_PALETTE_HOTKEY,
  WRAP_HOTKEYS,
  WRAP_MODES,
  commandColor,
  convertInnerMarkdown,
  cursorRetreatForColor,
  cursorRetreatForTag,
  emCommandHotkeys,
  innerFromSelection,
  nextColor,
  prepareSelection,
  removeColorSpans,
  toggleOneShotColor,
  wrapWithColor,
  wrapWithTag,
} from "./wrapLogic";

describe("innerFromSelection", () => {
  it("strips bold markdown when the whole selection matches", () => {
    expect(innerFromSelection("**x**", WRAP_MODES[0].outerMarkdown)).toBe("x");
  });
  it("does not match when the string does not start and end with bold markers", () => {
    expect(innerFromSelection("x **a**", WRAP_MODES[0].outerMarkdown)).toBe("x **a**");
  });
  it("strips italic markdown when the whole selection matches", () => {
    expect(innerFromSelection("*x*", WRAP_MODES[1].outerMarkdown)).toBe("x");
  });
  it("leaves a single asterisk segment unchanged", () => {
    expect(innerFromSelection("*not closed", WRAP_MODES[1].outerMarkdown)).toBe("*not closed");
  });
  it("strips strikethrough markdown when the whole selection matches", () => {
    expect(innerFromSelection("~~x~~", WRAP_MODES[2].outerMarkdown)).toBe("x");
  });
  it("does not match when the string does not start and end with strikethrough markers", () => {
    expect(innerFromSelection("x ~~a~~", WRAP_MODES[2].outerMarkdown)).toBe("x ~~a~~");
  });
  it("strips existing u tags when the whole selection matches", () => {
    expect(innerFromSelection("<u>x</u>", WRAP_MODES[3].outerMarkdown)).toBe("x");
  });
  it("does not match when the string does not start and end with u tags", () => {
    expect(innerFromSelection("x <u>a</u>", WRAP_MODES[3].outerMarkdown)).toBe("x <u>a</u>");
  });
});

describe("wrapWithTag", () => {
  it("wraps with b", () => {
    expect(wrapWithTag("hi", "b")).toBe("<b>hi</b>");
  });
  it("wraps with em", () => {
    expect(wrapWithTag("hi", "em")).toBe("<em>hi</em>");
  });
  it("wraps with s", () => {
    expect(wrapWithTag("hi", "s")).toBe("<s>hi</s>");
  });
  it("wraps with u", () => {
    expect(wrapWithTag("hi", "u")).toBe("<u>hi</u>");
  });
});

describe("emCommandHotkeys", () => {
  it("includes Mod+Shift+E always", () => {
    expect(emCommandHotkeys(false)[0]).toEqual(WRAP_HOTKEYS.em);
    expect(emCommandHotkeys(true)[0]).toEqual(WRAP_HOTKEYS.em);
  });
  it("adds Mod+Shift+I when alsoModShiftI is true", () => {
    expect(emCommandHotkeys(true)).toEqual([WRAP_HOTKEYS.em, EM_ALT_HOTKEY]);
  });
  it("omits Mod+Shift+I when alsoModShiftI is false", () => {
    expect(emCommandHotkeys(false)).toEqual([WRAP_HOTKEYS.em]);
  });
});

describe("color palette command", () => {
  it("has a dedicated Mod+Shift+O hotkey", () => {
    expect(OPEN_COLOR_PALETTE_COMMAND.id).toBe("wrap-with-open-color-palette");
    expect(OPEN_COLOR_PALETTE_HOTKEY).toEqual({ modifiers: ["Mod", "Shift"], key: "o" });
  });
});

describe("cursorRetreatForTag", () => {
  it("matches original b / s closing tag length (4)", () => {
    expect(cursorRetreatForTag("b")).toBe(4);
    expect(cursorRetreatForTag("s")).toBe(4);
  });
  it("matches original em closing tag length (5)", () => {
    expect(cursorRetreatForTag("em")).toBe(5);
  });
  it("matches u closing tag length (4)", () => {
    expect(cursorRetreatForTag("u")).toBe(4);
  });
});

describe("convertInnerMarkdown", () => {
  it("converts bold italic then bold then italic then strike", () => {
    expect(convertInnerMarkdown("***x***")).toBe("<b><em>x</em></b>");
    expect(convertInnerMarkdown("**x**")).toBe("<b>x</b>");
    expect(convertInnerMarkdown("*x*")).toBe("<em>x</em>");
    expect(convertInnerMarkdown("~~x~~")).toBe("<s>x</s>");
  });
  it("converts nested forms inside a longer string", () => {
    expect(convertInnerMarkdown("hello **world**")).toBe("hello <b>world</b>");
  });
  it("leaves existing HTML alone", () => {
    expect(convertInnerMarkdown("<b>x</b>")).toBe("<b>x</b>");
  });
});

describe("prepareSelection", () => {
  it("strips outer bold markdown then wraps clean for b", () => {
    expect(prepareSelection("**hello**", "b")).toBe("hello");
  });
  it("strips outer HTML b when preparing for b", () => {
    expect(prepareSelection("<b>hello</b>", "b")).toBe("hello");
  });
  it("converts inner bold when preparing for u", () => {
    expect(prepareSelection("**hello**", "u")).toBe("<b>hello</b>");
  });
  it("converts partial bold when preparing for u", () => {
    expect(prepareSelection("hello **world**", "u")).toBe("hello <b>world</b>");
  });
  it("strips outer color span when preparing for color", () => {
    expect(prepareSelection('<span style="color: #c00000">hi</span>', "color")).toBe("hi");
  });
  it("converts inner markdown when preparing for color", () => {
    expect(prepareSelection("**hello**", "color")).toBe("<b>hello</b>");
  });
});

describe("wrapWithColor / cursorRetreatForColor / nextColor", () => {
  it("wraps with a color span", () => {
    expect(wrapWithColor("hi", "#c00000")).toBe('<span style="color: #c00000">hi</span>');
  });
  it("retreats by </span> length (7)", () => {
    expect(cursorRetreatForColor()).toBe(7);
  });
  it("returns current color and advances index with wraparound", () => {
    expect(nextColor(["#a", "#b"], 0)).toEqual({ color: "#a", nextIndex: 1 });
    expect(nextColor(["#a", "#b"], 1)).toEqual({ color: "#b", nextIndex: 0 });
  });
});

describe("color locking", () => {
  it("uses the locked color without advancing the next random index", () => {
    expect(commandColor(["#a", "#b"], 1, "#a")).toEqual({ color: "#a", oneShot: false, nextIndex: false });
  });
  it("uses a one-shot color without advancing the next random index", () => {
    expect(commandColor(["#a", "#b"], 1, null, "#a")).toEqual({ color: "#a", oneShot: true, nextIndex: false });
  });
  it("uses the locked color before a one-shot color", () => {
    expect(commandColor(["#a", "#b"], 1, "#b", "#a")).toEqual({ color: "#b", oneShot: false, nextIndex: false });
  });
  it("falls back to next color when no saved color is locked", () => {
    expect(commandColor(["#a", "#b"], 1, null)).toEqual({ color: "#b", nextIndex: 0, oneShot: false });
  });
  it("sets one-shot color when clicking a different swatch", () => {
    expect(toggleOneShotColor("#a", "#b")).toBe("#b");
  });
  it("clears one-shot color when clicking the same swatch again", () => {
    expect(toggleOneShotColor("#a", "#a")).toBeNull();
  });
});

describe("removeColorSpans", () => {
  it("strips a single color span", () => {
    expect(removeColorSpans('<span style="color: #c00000">hi</span>')).toBe("hi");
  });
  it("keeps nested HTML inside the span", () => {
    expect(removeColorSpans('a <span style="color: #c00000"><b>b</b></span> c')).toBe("a <b>b</b> c");
  });
  it("strips multiple spans", () => {
    expect(removeColorSpans('<span style="color: #a">x</span> <span style="color: #b">y</span>')).toBe("x y");
  });
  it("is a no-op when there are no color spans", () => {
    expect(removeColorSpans("<b>hi</b>")).toBe("<b>hi</b>");
  });
});
