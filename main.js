/*
THIS FILE IS GENERATED FROM src/main.ts — run npm run build
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WrapWithPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/wrapLogic.ts
function innerFromSelection(selection, outerMarkdown) {
  return selection.replace(outerMarkdown, "$1");
}
function wrapWithTag(inner, tag) {
  return `<${tag}>${inner}</${tag}>`;
}
function cursorRetreatForTag(tag) {
  return `</${tag}>`.length;
}
var WRAP_MODES = [
  { id: "wrap-with-b", name: "Wrap selection with <b> tags", tag: "b", outerMarkdown: /^\*\*(.+)\*\*$/ },
  { id: "wrap-with-em", name: "Wrap selection with <em> tags", tag: "em", outerMarkdown: /^\*(.+)\*$/ },
  { id: "wrap-with-s", name: "Wrap selection with <s> tags", tag: "s", outerMarkdown: /^~~(.+)~~$/ }
];

// src/main.ts
function applyWrap(editor, tag, outerMarkdown) {
  const selection = editor.getSelection();
  const inner = innerFromSelection(selection, outerMarkdown);
  editor.replaceSelection(wrapWithTag(inner, tag));
  if (!selection) {
    const cursor = editor.getCursor();
    editor.setCursor({ line: cursor.line, ch: cursor.ch - cursorRetreatForTag(tag) });
  }
}
var HOTKEYS = {
  b: { modifiers: ["Mod", "Shift"], key: "b" },
  em: { modifiers: ["Mod", "Shift"], key: "e" },
  s: { modifiers: ["Mod", "Shift"], key: "s" }
};
var WrapWithPlugin = class extends import_obsidian.Plugin {
  async onload() {
    for (const mode of WRAP_MODES) {
      this.addCommand({
        id: mode.id,
        name: mode.name,
        hotkeys: [HOTKEYS[mode.tag]],
        editorCallback: (editor) => applyWrap(editor, mode.tag, mode.outerMarkdown)
      });
    }
  }
};
