import {Plugin, showMessage, Dialog, Menu, Protyle, IOperation, getAllEditor, Setting} from "siyuan";
import "./index.scss";
import {LibreTranslate} from "./lib/translator";
import {PluginSettings, DEFAULT_SETTINGS} from "./ui/settings";
import {TranslateDialog} from "./ui/translateDialog";

const STORAGE_NAME = "settings";

class LibreTranslatePlugin extends Plugin {

    private settings: PluginSettings = {...DEFAULT_SETTINGS};
    private translator: LibreTranslate;
    private translateDialog: TranslateDialog | null = null;
    private eventBusClickEditorContent: (event: any) => void;
    private apiUrlInput: HTMLInputElement;
    private apiKeyInput: HTMLInputElement;
    private sourceLangSelect: HTMLSelectElement;
    private targetLangSelect: HTMLSelectElement;

    constructor(app: any) {
        super(app);
        this.translator = new LibreTranslate(this.settings.apiUrl, this.settings.apiKey);
        this.eventBusClickEditorContent = this.handleClickEditorContent.bind(this);
    }

    async onload() {
        await this.loadSettings();

        this.translator.setBaseUrl(this.settings.apiUrl);
        this.translator.setApiKey(this.settings.apiKey);

        this.addIcons(`<symbol id="iconLibreTranslate" viewBox="0 0 32 32">
<path d="M16 3C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3zm0 2c6.065 0 11 4.935 11 11s-4.935 11-11 11S5 22.065 5 16 9.935 5 16 5zm-4.5 5.5v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zm-6 4v2h-3v-2h3zm6 0v2h-3v-2h3zM12 9h2v2h-2V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zM9 13h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM9 21h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"></path>
</symbol>`);

        this.addTopBar({
            icon: "iconLibreTranslate",
            title: this.i18n.openTranslate,
            position: "right",
            callback: () => {
                this.openTranslateDialog();
            }
        });

        this.eventBus.on("click-editorcontent", this.eventBusClickEditorContent);

        this.initSettings();
    }

    private initSettings(): void {
        this.apiUrlInput = document.createElement("input");
        this.apiUrlInput.className = "b3-text-field fn__block";
        this.apiUrlInput.value = this.settings.apiUrl;

        this.apiKeyInput = document.createElement("input");
        this.apiKeyInput.className = "b3-text-field fn__block";
        this.apiKeyInput.type = "password";
        this.apiKeyInput.value = this.settings.apiKey;

        this.sourceLangSelect = document.createElement("select");
        this.sourceLangSelect.className = "b3-select fn__block";
        this.sourceLangSelect.innerHTML = `<option value="auto">${this.i18n.auto}</option>`;
        this.sourceLangSelect.value = this.settings.sourceLang;

        this.targetLangSelect = document.createElement("select");
        this.targetLangSelect.className = "b3-select fn__block";
        this.targetLangSelect.value = this.settings.targetLang;

        this.setting = new Setting({
            confirmCallback: () => {
                this.saveSettings();
            }
        });

        this.setting.addItem({
            title: this.i18n.apiUrl,
            direction: "row",
            description: "LibreTranslate API URL",
            createActionElement: () => {
                this.apiUrlInput.value = this.settings.apiUrl;
                return this.apiUrlInput;
            }
        });

        this.setting.addItem({
            title: this.i18n.apiKey,
            direction: "row",
            description: "Optional API key",
            createActionElement: () => {
                this.apiKeyInput.value = this.settings.apiKey;
                return this.apiKeyInput;
            }
        });

        this.setting.addItem({
            title: this.i18n.sourceLang,
            direction: "row",
            description: this.i18n.auto,
            createActionElement: () => {
                this.sourceLangSelect.value = this.settings.sourceLang;
                return this.sourceLangSelect;
            }
        });

        this.setting.addItem({
            title: this.i18n.targetLang,
            direction: "row",
            description: "Target language",
            createActionElement: () => {
                this.targetLangSelect.value = this.settings.targetLang;
                return this.targetLangSelect;
            }
        });
    }

    async onLayoutReady() {
    }

    onunload() {
        this.eventBus.off("click-editorcontent", this.eventBusClickEditorContent);
    }

    uninstall() {
        this.removeData(STORAGE_NAME).catch(e => {
            showMessage(`uninstall [${this.name}] remove data [${STORAGE_NAME}] fail: ${e.msg}`);
        });
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

    private async saveSettings(): Promise<void> {
        const newSettings: PluginSettings = {
            apiUrl: this.apiUrlInput.value,
            apiKey: this.apiKeyInput.value,
            sourceLang: this.sourceLangSelect.value,
            targetLang: this.targetLangSelect.value
        };

        this.settings = newSettings;
        this.translator.setBaseUrl(newSettings.apiUrl);
        this.translator.setApiKey(newSettings.apiKey);

        try {
            await this.saveData(STORAGE_NAME, newSettings);
            showMessage(`[${this.name}] settings saved`, 2000);
        } catch (e: any) {
            showMessage(`[${this.name}] save settings fail: ${e.message}`);
        }
    }

    private handleClickEditorContent(event: any): void {
        const detail = event.detail;
        const menu = detail.menu as Menu;
        const selectedText = window.getSelection()?.toString();

        if (selectedText && selectedText.trim()) {
            menu.addItem({
                icon: "iconLibreTranslate",
                label: this.i18n.translate,
                click: () => {
                    this.openTranslateDialog(selectedText);
                }
            });
        }
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
            }
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
}

export default LibreTranslatePlugin;