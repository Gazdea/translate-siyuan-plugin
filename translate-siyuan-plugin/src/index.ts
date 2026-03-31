import {
    Plugin,
    showMessage,
    Dialog,
    Menu,
    Protyle,
    IOperation,
    ICard,
    ICardData,
    getAllEditor
} from "siyuan";
import "./index.scss";
import {LibreTranslate} from "./lib/translator";
import {PluginSettings, SettingsPanel, DEFAULT_SETTINGS} from "./ui/settings";
import {TranslateDialog} from "./ui/translateDialog";

const STORAGE_NAME = "settings";

class LibreTranslatePlugin extends Plugin {

    private settings: PluginSettings = {...DEFAULT_SETTINGS};
    private translator: LibreTranslate;
    private settingsPanel: SettingsPanel | null = null;
    private translateDialog: TranslateDialog | null = null;
    private currentProtyle: Protyle | null = null;
    private selectedText: string = "";
    private eventBusClickEditorContent: any = this.handleClickEditorContent.bind(this);
    private eventBusPaste: any = this.handlePaste.bind(this);

    constructor(app: any) {
        super(app);
    }

    async onload() {
        this.loadStyles();

        await this.loadSettings();

        this.translator = new LibreTranslate(this.settings.apiUrl, this.settings.apiKey);

        this.addIcons(`<symbol id="iconLibreTranslate" viewBox="0 0 32 32">
<path d="M16 3C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3zm0 2c6.065 0 11 4.935 11 11s-4.935 11-11 11S5 22.065 5 16 9.935 5 16 5zm-4.5 5.5v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zM12 9h2v2h-2V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zM9 13h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM9 21h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"></path>
</symbol>`);

        this.addCommand({
            langKey: "translateHotkey",
            hotkey: this.settings.hotkey,
            callback: () => {
                this.translateSelection();
            }
        });

        this.addTopBar({
            icon: "iconLibreTranslate",
            title: this.i18n.openTranslate,
            position: "right",
            callback: () => {
                this.openTranslateDialog();
            }
        });

        this.protyleSlash = [{
            filter: ["translate", "перевод", "libretranslate"],
            html: `<div class="b3-list-item__first">
                <svg class="b3-list-item__graphic"><use xlink:href="#iconLibreTranslate"></use></svg>
                <span class="b3-list-item__text">${this.i18n.openTranslate}</span>
            </div>`,
            callback: () => {
                this.openTranslateDialog();
            }
        }];

        this.eventBus.on("click-editorcontent", this.eventBusClickEditorContent);
        this.eventBus.on("paste", this.eventBusPaste);
    }

    async onLayoutReady() {
        const editors = getAllEditor();
        if (editors.length > 0) {
            this.currentProtyle = editors[0].protyle;
        }

        this.eventBus.on("switch-protyle", (detail: any) => {
            this.currentProtyle = detail.protyle;
        });
    }

    onunload() {
        this.eventBus.off("click-editorcontent", this.eventBusClickEditorContent);
        this.eventBus.off("paste", this.eventBusPaste);
    }

    uninstall() {
        this.removeData(STORAGE_NAME).catch(e => {
            showMessage(`uninstall [${this.name}] remove data [${STORAGE_NAME}] fail: ${e.msg}`);
        });
    }

    private loadStyles(): void {
        const styleId = "libre-translate-plugin-style";
        if (document.getElementById(styleId)) {
            return;
        }

        const link = document.createElement("link");
        link.id = styleId;
        link.rel = "stylesheet";
        link.href = "./stage/build/plugin/translate-siyuan-plugin/style.css";
        document.head.appendChild(link);
    }

    private async loadSettings(): Promise<void> {
        try {
            const data = await this.loadData(STORAGE_NAME);
            if (data) {
                this.settings = {...DEFAULT_SETTINGS, ...data};
            }
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }

    private async saveSettings(settings: PluginSettings): Promise<void> {
        this.settings = settings;
        this.translator.setBaseUrl(settings.apiUrl);
        this.translator.setApiKey(settings.apiKey);

        try {
            await this.saveData(STORAGE_NAME, settings);
        } catch (e: any) {
            showMessage(`[${this.name}] save settings fail: ${e.message}`);
        }
    }

    openSetting(): void {
        const dialog = new Dialog({
            title: `${this.i18n.pluginName} - ${this.i18n.settings}`,
            width: "600px",
            content: "<div class=\"libre-translate-settings\" style=\"padding: 20px;\"></div>"
        });

        const container = dialog.element.querySelector(".libre-translate-settings");
        if (container) {
            this.settingsPanel = new SettingsPanel(
                this.app,
                this.settings,
                (newSettings) => this.saveSettings(newSettings),
                this.i18n
            );

            const settingElement = this.settingsPanel.getSettingElement();
            if (settingElement) {
                container.appendChild(settingElement);
                this.settingsPanel.loadLanguages();
            } else {
                console.error("[LibreTranslate] Settings panel element is null/undefined");
                showMessage("[LibreTranslate] Failed to load settings panel");
            }
        }
    }

    private handleClickEditorContent(event: any): void {
        const detail = event.detail;
        const menu = detail.menu as Menu;
        const selectedText = window.getSelection()?.toString();

        if (selectedText && selectedText.trim()) {
            this.selectedText = selectedText;
            menu.addItem({
                icon: "iconLibreTranslate",
                label: this.i18n.translate,
                click: () => {
                    this.openTranslateDialog(selectedText);
                }
            });
        }
    }

    private handlePaste(): void {
    }

    private translateSelection(): void {
        const selectedText = window.getSelection()?.toString();

        if (!selectedText || !selectedText.trim()) {
            showMessage(this.i18n.noText);
            return;
        }

        this.selectedText = selectedText;
        this.openTranslateDialog(selectedText);
    }

    private openTranslateDialog(initialText: string = ""): void {
        if (this.translateDialog) {
            this.translateDialog.destroy();
        }

        const editors = getAllEditor();
        let protyle: Protyle | null = null;
        if (editors.length > 0) {
            protyle = editors[0].protyle;
        }

        this.translateDialog = new TranslateDialog({
            app: this.app,
            settings: this.settings,
            initialText: initialText,
            onReplace: (original, translated) => {
                this.replaceTextInEditor(original, translated, protyle);
            },
            i18n: this.i18n
        });
    }

    private async replaceTextInEditor(original: string, translated: string, protyle: Protyle | null): Promise<void> {
        if (!protyle) {
            const editors = getAllEditor();
            if (editors.length > 0) {
                protyle = editors[0].protyle;
            }
        }

        if (!protyle) {
            showMessage(this.i18n.noText);
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        try {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();

            if (!selectedText || selectedText.trim() === "") {
                return;
            }

            const startContainer = range.startContainer;
            let blockElement: HTMLElement | null = null;

            if (startContainer.nodeType === Node.TEXT_NODE) {
                let current: HTMLElement | null = startContainer.parentElement;
                while (current) {
                    if (current.dataset.nodeId) {
                        blockElement = current;
                        break;
                    }
                    current = current.parentElement;
                }
            }

            if (!blockElement) {
                blockElement = protyle.wysiwyg.element.querySelector("[data-node-id]");
            }

            if (!blockElement || !blockElement.dataset.nodeId) {
                showMessage("Cannot find block to replace");
                return;
            }

            const blockId = blockElement.dataset.nodeId;
            const editElement = blockElement.querySelector('[contenteditable="true"]') as HTMLElement;

            if (editElement) {
                const currentText = editElement.textContent || "";
                const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const regex = new RegExp(escapedOriginal, "g");
                const newText = currentText.replace(regex, translated);

                if (newText !== currentText) {
                    editElement.textContent = newText;

                    const doOperations: IOperation[] = [];
                    doOperations.push({
                        id: blockId,
                        data: editElement.outerHTML,
                        action: "update"
                    });

                    protyle.getInstance().transaction(doOperations);
                    showMessage(this.i18n.replaced);
                }
            }
        } catch (e: any) {
            console.error("[LibreTranslate] Error replacing text:", e);
            showMessage(`${this.i18n.error}: ${e.message}`);
        }
    }

    async updateCards(options: ICardData) {
        options.cards.sort((a: ICard, b: ICard) => {
            if (a.blockID < b.blockID) {
                return -1;
            }
            if (a.blockID > b.blockID) {
                return 1;
            }
            return 0;
        });
        return options;
    }
}

export default LibreTranslatePlugin;
