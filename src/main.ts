import { App, ButtonComponent, Editor, Plugin, PluginSettingTab, Setting, setIcon } from "obsidian";
import { colorAfterArrowKey, colorPopupPosition, preserveEditorSelection } from "./colorPopup";
import {
  COLOR_COMMAND,
  COLOR_HOTKEY,
  DEFAULT_COLORS,
  OPEN_COLOR_PALETTE_COMMAND,
  OPEN_COLOR_PALETTE_HOTKEY,
  REMOVE_COLOR_COMMAND,
  REMOVE_COLOR_HOTKEY,
  WRAP_MODES,
  WRAP_HOTKEYS,
  commandColor,
  cursorRetreatForColor,
  cursorRetreatForTag,
  emCommandHotkeys,
  prepareSelection,
  removeColorSpans,
  toggleOneShotColor,
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
  lockedColor: string | null;
  oneShotColor: string | null;
}

export const DEFAULT_SETTINGS: WrapWithSettings = {
  emAlsoModShiftI: true,
  colors: [...DEFAULT_COLORS],
  nextColorIndex: 0,
  lockedColor: null,
  oneShotColor: null,
};

export default class WrapWithPlugin extends Plugin {
  settings: WrapWithSettings = DEFAULT_SETTINGS;
  private commandsRegistered = false;
  private colorStatusEl: HTMLElement | null = null;
  private colorPopup: ColorCommandPopup | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerWrapCommands();
    this.addColorStatusBar();
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
    if (this.settings.lockedColor && !this.settings.colors.includes(this.settings.lockedColor)) this.settings.lockedColor = null;
    if (this.settings.oneShotColor && !this.settings.colors.includes(this.settings.oneShotColor)) this.settings.oneShotColor = null;
  }

  async setLockedColor(color: string | null): Promise<void> {
    this.settings.lockedColor = color && this.settings.colors.includes(color) ? color : null;
    if (this.settings.lockedColor) this.settings.oneShotColor = null;
    this.clampColorIndex();
    await this.saveSettings();
    this.updateColorStatusBar();
  }

  async setOneShotColor(color: string | null): Promise<void> {
    this.settings.oneShotColor = color && this.settings.colors.includes(color) ? color : null;
    if (this.settings.oneShotColor) this.settings.lockedColor = null;
    this.clampColorIndex();
    await this.saveSettings();
    this.updateColorStatusBar();
  }

  updateColorStatusBar(): void {
    if (!this.colorStatusEl) return;
    const activeColor = this.settings.lockedColor ?? this.settings.oneShotColor;
    this.colorStatusEl.empty();
    setIcon(this.colorStatusEl, this.settings.lockedColor ? "lock" : "paintbrush");
    this.colorStatusEl.setAttribute("aria-label", this.settings.lockedColor ? `Wrap With color locked to ${this.settings.lockedColor}` : this.settings.oneShotColor ? `Wrap With next color ${this.settings.oneShotColor}` : "Wrap With color random");
    this.colorStatusEl.setAttribute("title", this.settings.lockedColor ? `Locked: ${this.settings.lockedColor}` : this.settings.oneShotColor ? `Next color: ${this.settings.oneShotColor}` : "Wrap color: Random");
    this.colorStatusEl.style.color = activeColor ?? "";
  }

  private addColorStatusBar(): void {
    const el = this.addStatusBarItem();
    this.colorStatusEl = el;
    el.addClass("wrap-with-color-status");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.style.cursor = "pointer";
    el.style.display = "inline-flex";
    el.style.alignItems = "center";
    el.style.gap = "4px";
    this.registerDomEvent(el, "mousedown", preserveEditorSelection);
    this.registerDomEvent(el, "click", () => this.toggleColorPopup());
    this.registerDomEvent(el, "keydown", (evt) => {
      if (evt.key !== "Enter" && evt.key !== " ") return;
      evt.preventDefault();
      this.toggleColorPopup();
    });
    this.register(() => this.closeColorPopup());
    this.updateColorStatusBar();
  }

  private toggleColorPopup(): void {
    if (this.colorPopup) { this.closeColorPopup(); return; }
    if (!this.colorStatusEl) return;
    this.colorPopup = new ColorCommandPopup(this, this.colorStatusEl, () => { this.colorPopup = null; });
    this.colorPopup.open();
  }

  private closeColorPopup(): void {
    this.colorPopup?.close();
    this.colorPopup = null;
  }

  registerWrapCommands(): void {
    if (this.commandsRegistered) {
      for (const mode of WRAP_MODES) this.removeCommand(mode.id);
      this.removeCommand(COLOR_COMMAND.id);
      this.removeCommand(OPEN_COLOR_PALETTE_COMMAND.id);
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
      id: OPEN_COLOR_PALETTE_COMMAND.id,
      name: OPEN_COLOR_PALETTE_COMMAND.name,
      icon: OPEN_COLOR_PALETTE_COMMAND.icon,
      hotkeys: [OPEN_COLOR_PALETTE_HOTKEY],
      editorCallback: () => this.toggleColorPopup(),
    });
    this.addCommand({
      id: COLOR_COMMAND.id,
      name: COLOR_COMMAND.name,
      icon: COLOR_COMMAND.icon,
      hotkeys: [COLOR_HOTKEY],
      editorCallback: async (editor) => {
        this.clampColorIndex();
        const selection = editor.getSelection();
        const { color, oneShot, nextIndex } = commandColor(this.settings.colors, this.settings.nextColorIndex, this.settings.lockedColor, this.settings.oneShotColor);
        const inner = prepareSelection(selection, "color");
        editor.replaceSelection(wrapWithColor(inner, color));
        if (!selection) {
          const cursor = editor.getCursor();
          editor.setCursor({ line: cursor.line, ch: cursor.ch - cursorRetreatForColor() });
        }
        if (oneShot) {
          this.settings.oneShotColor = null;
          await this.saveSettings();
          this.updateColorStatusBar();
        } else if (nextIndex !== false) {
          this.settings.nextColorIndex = nextIndex;
          await this.saveSettings();
        }
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

class ColorCommandPopup {
  private selectedColor: string;
  private popupEl: HTMLElement | null = null;
  private readonly doc: Document;
  private readonly win: Window;

  constructor(private plugin: WrapWithPlugin, private anchorEl: HTMLElement, private onClose: () => void) {
    this.plugin.clampColorIndex();
    this.selectedColor = this.plugin.settings.lockedColor ?? this.plugin.settings.oneShotColor ?? this.plugin.settings.colors[this.plugin.settings.nextColorIndex] ?? this.plugin.settings.colors[0];
    this.doc = anchorEl.ownerDocument;
    this.win = this.doc.defaultView ?? window;
  }

  open(): void {
    const popupEl = this.doc.body.createDiv({ cls: "wrap-with-color-popup" });
    popupEl.setAttribute("role", "dialog");
    popupEl.setAttribute("aria-label", "Wrap color");
    popupEl.style.position = "fixed";
    popupEl.style.zIndex = "1000";
    popupEl.style.width = "260px";
    popupEl.style.maxWidth = "calc(100vw - 16px)";
    popupEl.style.padding = "12px";
    popupEl.style.background = "var(--background-primary)";
    popupEl.style.border = "1px solid var(--background-modifier-border)";
    popupEl.style.borderRadius = "8px";
    popupEl.style.boxShadow = "var(--shadow-s)";
    popupEl.addEventListener("mousedown", preserveEditorSelection);
    this.popupEl = popupEl;
    this.render();
    this.doc.addEventListener("mousedown", this.handleDocumentMouseDown, true);
    this.doc.addEventListener("keydown", this.handleDocumentKeyDown, true);
    this.win.addEventListener("resize", this.position);
    this.win.addEventListener("scroll", this.position, true);
  }

  close(): void {
    if (!this.popupEl) return;
    this.doc.removeEventListener("mousedown", this.handleDocumentMouseDown, true);
    this.doc.removeEventListener("keydown", this.handleDocumentKeyDown, true);
    this.win.removeEventListener("resize", this.position);
    this.win.removeEventListener("scroll", this.position, true);
    this.popupEl.remove();
    this.popupEl = null;
    this.onClose();
  }

  private async selectColor(color: string): Promise<void> {
    const oneShotColor = toggleOneShotColor(this.plugin.settings.oneShotColor, color);
    this.selectedColor = oneShotColor ?? this.plugin.settings.colors[this.plugin.settings.nextColorIndex] ?? this.plugin.settings.colors[0];
    if (this.plugin.settings.lockedColor) await this.plugin.setLockedColor(color);
    else await this.plugin.setOneShotColor(oneShotColor);
    this.render();
  }

  private render(): void {
    const contentEl = this.popupEl;
    if (!contentEl) return;
    const lockedColor = this.plugin.settings.lockedColor;
    const oneShotColor = this.plugin.settings.oneShotColor;
    contentEl.empty();

    const titleEl = contentEl.createDiv({ text: "Wrap color" });
    titleEl.style.fontWeight = "var(--font-semibold)";
    titleEl.style.marginBottom = "8px";

    const currentEl = contentEl.createDiv();
    currentEl.style.display = "flex";
    currentEl.style.alignItems = "center";
    currentEl.style.gap = "8px";
    currentEl.style.marginBottom = "12px";
    currentEl.createSpan({ text: lockedColor ? `Locked: ${lockedColor}` : oneShotColor ? `Next: ${oneShotColor}` : "Random" });

    const gridEl = contentEl.createDiv();
    gridEl.style.display = "grid";
    gridEl.style.gridTemplateColumns = "repeat(auto-fill, minmax(36px, 1fr))";
    gridEl.style.gap = "8px";
    gridEl.style.marginBottom = "16px";

    this.plugin.settings.colors.forEach((color) => {
      const buttonEl = gridEl.createEl("button");
      buttonEl.type = "button";
      buttonEl.setAttribute("aria-label", `Select ${color}`);
      buttonEl.setAttribute("title", color);
      buttonEl.style.backgroundColor = color;
      buttonEl.style.border = color === this.selectedColor ? "2px solid var(--text-normal)" : "1px solid var(--background-modifier-border)";
      buttonEl.style.borderRadius = "4px";
      buttonEl.style.cursor = "pointer";
      buttonEl.style.height = "32px";
      buttonEl.style.minWidth = "32px";
      buttonEl.onClickEvent(() => this.selectColor(color));
    });

    const actionsEl = contentEl.createDiv();
    actionsEl.style.display = "flex";
    actionsEl.style.justifyContent = "flex-end";

    new ButtonComponent(actionsEl)
      .setIcon(lockedColor ? "unlock" : "lock")
      .setButtonText(lockedColor ? "Unlock" : "Lock")
      .setTooltip(lockedColor ? "Return the color command to random" : `Lock the color command to ${this.selectedColor}`)
      .onClick(async () => {
        await this.plugin.setLockedColor(lockedColor ? null : this.selectedColor);
        this.render();
      });
    this.position();
  }

  private position = (): void => {
    if (!this.popupEl) return;
    const anchor = this.anchorEl.getBoundingClientRect();
    const popup = this.popupEl.getBoundingClientRect();
    const position = colorPopupPosition(anchor, popup, { width: this.win.innerWidth, height: this.win.innerHeight });
    this.popupEl.style.left = `${position.left}px`;
    this.popupEl.style.top = `${position.top}px`;
  };

  private handleDocumentMouseDown = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    if (!target) return;
    if (this.popupEl?.contains(target) || this.anchorEl.contains(target)) return;
    this.close();
  };

  private handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    const color = colorAfterArrowKey(this.plugin.settings.colors, this.selectedColor, event.key);
    if (color) {
      event.preventDefault();
      event.stopPropagation();
      this.selectedColor = color;
      this.render();
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    void this.selectColor(this.selectedColor).then(() => this.close());
  };
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
      .setDesc("When the color command is random, each color wrap uses the next color in this list, then wraps around. Min 1 color.")
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
            const oldColor = this.plugin.settings.colors[i];
            this.plugin.settings.colors[i] = value;
            if (this.plugin.settings.lockedColor === oldColor) this.plugin.settings.lockedColor = null;
            if (this.plugin.settings.oneShotColor === oldColor) this.plugin.settings.oneShotColor = null;
            this.plugin.updateColorStatusBar();
            await this.plugin.saveSettings();
          })
        )
        .addButton((btn) =>
          btn.setButtonText("Remove").setDisabled(this.plugin.settings.colors.length <= 1).onClick(async () => {
            if (this.plugin.settings.colors.length <= 1) return;
            const oldColor = this.plugin.settings.colors[i];
            this.plugin.settings.colors.splice(i, 1);
            if (this.plugin.settings.lockedColor === oldColor) this.plugin.settings.lockedColor = null;
            if (this.plugin.settings.oneShotColor === oldColor) this.plugin.settings.oneShotColor = null;
            this.plugin.clampColorIndex();
            this.plugin.updateColorStatusBar();
            await this.plugin.saveSettings();
            this.display();
          })
        );
    });
  }
}
