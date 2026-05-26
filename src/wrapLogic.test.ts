import { describe, expect, it } from "vitest";
import {
  EM_ALT_HOTKEY,
  WRAP_HOTKEYS,
  WRAP_MODES,
  cursorRetreatForTag,
  emCommandHotkeys,
  innerFromSelection,
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
