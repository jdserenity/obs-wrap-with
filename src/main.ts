import { App, Editor, Plugin, PluginSettingTab, Setting } from "obsidian";
import {
  COLOR_COMMAND,
  COLOR_HOTKEY,
  DEFAULT_COLORS,
  REMOVE_COLOR_COMMAND,
  REMOVE_COLOR_HOTKEY,
  WRAP_MODES,
  WRAP_HOTKEYS,
  cursorRetreatForColor,
  cursorRetreatForTag,
  emCommandHotkeys,
  nextColor,
  prepareSelection,
  removeColorSpans,
  wrapWithColor,
  wrapWithTag,
} from "./wrapLogic";

function applyWrap(editor: Editor, tag: string): void {
  const selection = editor.getSelection();
  const inner = prepareSelection(selection, tag);
  editor.replaceSelection(wrapWithTag(inner, tag));
  if (!selection) {
    const cursor = editor.getCursor();
    editor.setCursor({ line: cursor.line, ch: cursor.ch - cursorRetreatForTag(tag) });
  }
}

export interface WrapWithSettings {
  emAlsoModShiftI: boolean;
  colors: string[];
  nextColorIndex: number;
}

export const DEFAULT_SETTINGS: WrapWithSettings = {
  emAlsoModShiftI: true,
  colors: [...DEFAULT_COLORS],
  nextColorIndex: 0,
};

export default class WrapWithPlugin extends Plugin {
  settings: WrapWithSettings = DEFAULT_SETTINGS;
  private commandsRegistered = false;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerWrapCommands();
    this.addSettingTab(new WrapWithSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data, {
      colors: data?.colors?.length ? [...data.colors] : [...DEFAULT_COLORS],
    });
    this.clampColorIndex();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  clampColorIndex(): void {
    const n = this.settings.colors.length;
    if (n < 1) { this.settings.colors = [...DEFAULT_COLORS]; }
    this.settings.nextColorIndex = ((this.settings.nextColorIndex % this.settings.colors.length) + this.settings.colors.length) % this.settings.colors.length;
  }

  registerWrapCommands(): void {
    if (this.commandsRegistered) {
      for (const mode of WRAP_MODES) this.removeCommand(mode.id);
      this.removeCommand(COLOR_COMMAND.id);
      this.removeCommand(REMOVE_COLOR_COMMAND.id);
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
        editorCallback: (editor) => applyWrap(editor, mode.tag),
      });
    }
    this.addCommand({
      id: COLOR_COMMAND.id,
      name: COLOR_COMMAND.name,
      icon: COLOR_COMMAND.icon,
      hotkeys: [COLOR_HOTKEY],
      editorCallback: async (editor) => {
        this.clampColorIndex();
        const selection = editor.getSelection();
        const { color, nextIndex } = nextColor(this.settings.colors, this.settings.nextColorIndex);
        const inner = prepareSelection(selection, "color");
        editor.replaceSelection(wrapWithColor(inner, color));
        if (!selection) {
          const cursor = editor.getCursor();
          editor.setCursor({ line: cursor.line, ch: cursor.ch - cursorRetreatForColor() });
        }
        this.settings.nextColorIndex = nextIndex;
        await this.saveSettings();
      },
    });
    this.addCommand({
      id: REMOVE_COLOR_COMMAND.id,
      name: REMOVE_COLOR_COMMAND.name,
      icon: REMOVE_COLOR_COMMAND.icon,
      hotkeys: [REMOVE_COLOR_HOTKEY],
      editorCallback: (editor) => {
        const selection = editor.getSelection();
        if (!selection) return;
        editor.replaceSelection(removeColorSpans(selection));
      },
    });
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

    new Setting(containerEl).setName("Color rotation").setHeading();
    new Setting(containerEl)
      .setName("Colors")
      .setDesc("Each color wrap uses the next color in this list, then wraps around. Min 1 color.")
      .addButton((btn) =>
        btn.setButtonText("Add color").onClick(async () => {
          this.plugin.settings.colors.push("#000000");
          this.plugin.clampColorIndex();
          await this.plugin.saveSettings();
          this.display();
        })
      );

    this.plugin.settings.colors.forEach((color, i) => {
      new Setting(containerEl)
        .setName(`Color ${i + 1}`)
        .addColorPicker((picker) =>
          picker.setValue(color).onChange(async (value) => {
            this.plugin.settings.colors[i] = value;
            await this.plugin.saveSettings();
          })
        )
        .addButton((btn) =>
          btn.setButtonText("Remove").setDisabled(this.plugin.settings.colors.length <= 1).onClick(async () => {
            if (this.plugin.settings.colors.length <= 1) return;
            this.plugin.settings.colors.splice(i, 1);
            this.plugin.clampColorIndex();
            await this.plugin.saveSettings();
            this.display();
          })
        );
    });
  }
}
