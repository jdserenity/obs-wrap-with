import { App, Editor, Plugin, PluginSettingTab, Setting } from "obsidian";
import {
  WRAP_MODES,
  WRAP_HOTKEYS,
  cursorRetreatForTag,
  emCommandHotkeys,
  innerFromSelection,
  wrapWithTag,
} from "./wrapLogic";

function applyWrap(editor: Editor, tag: string, outerMarkdown: RegExp): void {
  const selection = editor.getSelection();
  const inner = innerFromSelection(selection, outerMarkdown);
  editor.replaceSelection(wrapWithTag(inner, tag));
  if (!selection) {
    const cursor = editor.getCursor();
    editor.setCursor({ line: cursor.line, ch: cursor.ch - cursorRetreatForTag(tag) });
  }
}

export interface WrapWithSettings {
  emAlsoModShiftI: boolean;
}

export const DEFAULT_SETTINGS: WrapWithSettings = { emAlsoModShiftI: true };

export default class WrapWithPlugin extends Plugin {
  settings: WrapWithSettings = DEFAULT_SETTINGS;
  private commandsRegistered = false;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerWrapCommands();
    this.addSettingTab(new WrapWithSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  registerWrapCommands(): void {
    if (this.commandsRegistered) {
      for (const mode of WRAP_MODES) this.removeCommand(mode.id);
    }
    for (const mode of WRAP_MODES) {
      const hotkeys =
        mode.tag === "em"
          ? emCommandHotkeys(this.settings.emAlsoModShiftI)
          : [WRAP_HOTKEYS[mode.tag]];
      this.addCommand({
        id: mode.id,
        name: mode.name,
        icon: mode.icon,
        hotkeys,
        editorCallback: (editor) => applyWrap(editor, mode.tag, mode.outerMarkdown),
      });
    }
    this.commandsRegistered = true;
  }
}

class WrapWithSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: WrapWithPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName("Also bind Mod+Shift+I to <em> wrap")
      .setDesc("When enabled, Cmd+Shift+I (Mac) or Ctrl+Shift+I wraps the selection in <em> tags, same as Mod+Shift+E.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.emAlsoModShiftI)
          .onChange(async (value) => {
            this.plugin.settings.emAlsoModShiftI = value;
            await this.plugin.saveSettings();
            this.plugin.registerWrapCommands();
          })
      );
  }
}
