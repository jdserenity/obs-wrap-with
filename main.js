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
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
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
  { id: "wrap-with-b", name: "Wrap selection with <b> tags", tag: "b", icon: "bold", outerMarkdown: /^\*\*(.+)\*\*$/ },
  { id: "wrap-with-em", name: "Wrap selection with <em> tags", tag: "em", icon: "italic", outerMarkdown: /^\*(.+)\*$/ },
  { id: "wrap-with-s", name: "Wrap selection with <s> tags", tag: "s", icon: "strikethrough", outerMarkdown: /^~~(.+)~~$/ },
  { id: "wrap-with-u", name: "Wrap selection with <u> tags", tag: "u", icon: "underline", outerMarkdown: /^<u>(.+)<\/u>$/ }
];
var WRAP_HOTKEYS = {
  b: { modifiers: ["Mod", "Shift"], key: "b" },
  em: { modifiers: ["Mod", "Shift"], key: "e" },
  s: { modifiers: ["Mod", "Shift"], key: "s" },
  u: { modifiers: ["Mod", "Shift"], key: "u" }
};
var EM_ALT_HOTKEY = { modifiers: ["Mod", "Shift"], key: "i" };
function emCommandHotkeys(alsoModShiftI) {
  return alsoModShiftI ? [WRAP_HOTKEYS.em, EM_ALT_HOTKEY] : [WRAP_HOTKEYS.em];
}

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
var DEFAULT_SETTINGS = { emAlsoModShiftI: true };
var WrapWithPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.commandsRegistered = false;
  }
  async onload() {
    await this.loadSettings();
    this.registerWrapCommands();
    this.addSettingTab(new WrapWithSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  registerWrapCommands() {
    if (this.commandsRegistered) {
      for (const mode of WRAP_MODES) this.removeCommand(mode.id);
    }
    for (const mode of WRAP_MODES) {
      const hotkeys = mode.tag === "em" ? emCommandHotkeys(this.settings.emAlsoModShiftI) : [WRAP_HOTKEYS[mode.tag]];
      this.addCommand({
        id: mode.id,
        name: mode.name,
        icon: mode.icon,
        hotkeys,
        editorCallback: (editor) => applyWrap(editor, mode.tag, mode.outerMarkdown)
      });
    }
    this.commandsRegistered = true;
  }
};
var WrapWithSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Also bind Mod+Shift+I to <em> wrap").setDesc("When enabled, Cmd+Shift+I (Mac) or Ctrl+Shift+I wraps the selection in <em> tags, same as Mod+Shift+E.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.emAlsoModShiftI).onChange(async (value) => {
        this.plugin.settings.emAlsoModShiftI = value;
        await this.plugin.saveSettings();
        this.plugin.registerWrapCommands();
      })
    );
  }
};
