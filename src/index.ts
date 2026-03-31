import {Plugin, showMessage, Dialog, Menu, Protyle, IOperation, getAllEditor, Setting} from "siyuan";
import "./index.scss";
import {LibreTranslate} from "./lib/translator";

const STORAGE_NAME = "settings";
const PLUGIN_VERSION = "0.1.1";

export interface PluginSettings {
    apiUrl: string;
    apiKey: string;
    sourceLang: string;
    targetLang: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
    apiUrl: "http://localhost:5000",
    apiKey: "",
    sourceLang: "auto",
    targetLang: "en"
};

class LibreTranslatePlugin extends Plugin {

    private translator: LibreTranslate;
    private translateDialog: TranslateDialog | null = null;
    private eventBusClickEditorContent: (event: any) => void;

    constructor(app: any) {
        super(app);
        this.translator = new LibreTranslate(DEFAULT_SETTINGS.apiUrl, DEFAULT_SETTINGS.apiKey);
        this.eventBusClickEditorContent = this.handleClickEditorContent.bind(this);
    }

    async onload() {
        this.data[STORAGE_NAME] = {...DEFAULT_SETTINGS};

        await this.loadData(STORAGE_NAME).catch(e => {
            console.log(`[${this.name}] load data [${STORAGE_NAME}] fail: `, e);
        });

        this.translator.setBaseUrl(this.data[STORAGE_NAME].apiUrl);
        this.translator.setApiKey(this.data[STORAGE_NAME].apiKey);

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

    async onLayoutReady() {
        console.log(`[${this.name}] loaded version ${PLUGIN_VERSION}`);
    }

    private initSettings(): void {
        const apiUrlInput = document.createElement("input");
        const apiKeyInput = document.createElement("input");
        const sourceLangSelect = document.createElement("select");
        const targetLangSelect = document.createElement("select");
        const testConnectionBtn = document.createElement("button");
        const connectionStatus = document.createElement("span");

        apiUrlInput.className = "b3-text-field fn__block";
        apiUrlInput.value = this.data[STORAGE_NAME].apiUrl || DEFAULT_SETTINGS.apiUrl;

        apiKeyInput.className = "b3-text-field fn__block";
        apiKeyInput.type = "password";
        apiKeyInput.value = this.data[STORAGE_NAME].apiKey || "";

        sourceLangSelect.className = "b3-select fn__block";
        sourceLangSelect.innerHTML = `<option value="auto">${this.i18n.auto}</option>`;
        sourceLangSelect.value = this.data[STORAGE_NAME].sourceLang || DEFAULT_SETTINGS.sourceLang;

        targetLangSelect.className = "b3-select fn__block";
        targetLangSelect.innerHTML = `
            <option value="en">English (en)</option>
            <option value="ru">Russian (ru)</option>
            <option value="zh">Chinese (zh)</option>
            <option value="es">Spanish (es)</option>
            <option value="fr">French (fr)</option>
            <option value="de">German (de)</option>`;
        targetLangSelect.value = this.data[STORAGE_NAME].targetLang || DEFAULT_SETTINGS.targetLang;

        testConnectionBtn.className = "b3-button b3-button--outline";
        testConnectionBtn.textContent = this.i18n.connectionTest || "Test Connection";
        testConnectionBtn.addEventListener("click", async () => {
            const urlInput = document.getElementById("apiUrl-input") as HTMLInputElement;
            const keyInput = document.getElementById("apiKey-input") as HTMLInputElement;
            
            testConnectionBtn.disabled = true;
            connectionStatus.textContent = this.i18n.loading || "Loading...";
            connectionStatus.className = "fn__margin-top";
            try {
                const tempTranslator = new LibreTranslate(urlInput?.value || "", keyInput?.value || "");
                const ok = await tempTranslator.healthCheck();
                if (ok) {
                    connectionStatus.textContent = this.i18n.connectionOk || "Connection successful";
                    connectionStatus.className = "fn__margin-top fn__success";
                } else {
                    connectionStatus.textContent = this.i18n.connectionError || "Connection failed";
                    connectionStatus.className = "fn__margin-top fn__error";
                }
            } catch (e) {
                connectionStatus.textContent = this.i18n.connectionError || "Connection failed";
                connectionStatus.className = "fn__margin-top fn__error";
            }
            testConnectionBtn.disabled = false;
        });

        apiUrlInput.id = "apiUrl-input";
        apiKeyInput.id = "apiKey-input";

        this.setting = new Setting({
            confirmCallback: () => {
                this.saveSettings(
                    apiUrlInput.value,
                    apiKeyInput.value,
                    sourceLangSelect.value,
                    targetLangSelect.value
                );
            }
        });

        this.setting.addItem({
            title: this.i18n.apiUrl,
            direction: "row",
            description: "LibreTranslate server URL",
            createActionElement: () => {
                const clone = apiUrlInput.cloneNode(true) as HTMLInputElement;
                clone.style.width = "100%";
                return clone;
            }
        });

        this.setting.addItem({
            title: this.i18n.apiKey,
            direction: "row",
            description: "Optional API key",
            createActionElement: () => {
                const clone = apiKeyInput.cloneNode(true) as HTMLInputElement;
                clone.style.width = "100%";
                return clone;
            }
        });

        this.setting.addItem({
            title: this.i18n.sourceLang,
            direction: "row",
            description: "Select source language",
            createActionElement: () => {
                const clone = sourceLangSelect.cloneNode(true) as HTMLSelectElement;
                clone.style.width = "100%";
                return clone;
            }
        });

        this.setting.addItem({
            title: this.i18n.targetLang,
            direction: "row",
            description: "Select target language",
            createActionElement: () => {
                const clone = targetLangSelect.cloneNode(true) as HTMLSelectElement;
                clone.style.width = "100%";
                return clone;
            }
        });

        this.setting.addItem({
            title: "Test Connection",
            direction: "row",
            actionElement: testConnectionBtn,
        });

        this.setting.addItem({
            title: "",
            direction: "row",
            createActionElement: () => {
                connectionStatus.style.display = "block";
                return connectionStatus;
            },
        });
    }

    onunload() {
        this.eventBus.off("click-editorcontent", this.eventBusClickEditorContent);
    }

    uninstall() {
        this.removeData(STORAGE_NAME).catch(e => {
            showMessage(`uninstall [${this.name}] remove data [${STORAGE_NAME}] fail: ${e.msg}`);
        });
    }

    private async saveSettings(
        apiUrl: string,
        apiKey: string,
        sourceLang: string,
        targetLang: string
    ): Promise<void> {
        const newSettings: PluginSettings = {
            apiUrl: apiUrl,
            apiKey: apiKey,
            sourceLang: sourceLang,
            targetLang: targetLang
        };

        this.data[STORAGE_NAME] = newSettings;
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
        
        const selection = window.getSelection();
        const selectedText = selection && selection.rangeCount > 0 ? selection.toString().trim() : "";

        if (selectedText) {
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
            settings: this.data[STORAGE_NAME] as PluginSettings,
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

class TranslateDialog {
    private dialog: Dialog;
    private translator: LibreTranslate;
    private settings: PluginSettings;

    private sourceTextarea: HTMLTextAreaElement;
    private translatedTextarea: HTMLTextAreaElement;
    private sourceLangSelect: HTMLSelectElement;
    private targetLangSelect: HTMLSelectElement;
    private translateButton: HTMLButtonElement;
    private loadingElement: HTMLDivElement;

    private onReplaceCallback: ((original: string, translated: string) => void) | null = null;

    constructor(options: {
        app: any;
        settings: PluginSettings;
        initialText?: string;
        onReplace?: (original: string, translated: string) => void;
    }) {
        this.settings = options.settings;
        this.translator = new LibreTranslate(options.settings.apiUrl, options.settings.apiKey);
        this.onReplaceCallback = options.onReplace || null;

        this.dialog = new Dialog({
            title: options.app.i18n?.translate || "Translate",
            width: "80%",
            maxWidth: "900px",
            height: "70vh",
            content: this.createDialogContent(options.initialText || "")
        });

        this.initEventListeners();
    }

    private createDialogContent(initialText: string): string {
        return `
<div class="libre-translate-dialog">
    <div class="libre-translate-dialog__header">
        <div class="libre-translate-dialog__langs">
            <div class="libre-translate-dialog__lang">
                <label>Source</label>
                <select class="b3-select" id="sourceLang">
                    <option value="auto">Auto</option>
                </select>
            </div>
            <button class="b3-button b3-button--outline" id="swapBtn" title="Swap">
                <svg style="width:16px;height:16px;"><use xlink:href="#iconSwap"></use></svg>
            </button>
            <div class="libre-translate-dialog__lang">
                <label>Target</label>
                <select class="b3-select" id="targetLang">
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                </select>
            </div>
        </div>
        <button class="b3-button b3-button--primary" id="translateBtn">Translate</button>
    </div>
    <div class="libre-translate-dialog__body">
        <div class="libre-translate-dialog__pane">
            <div class="libre-translate-dialog__pane-header">Source Text</div>
            <textarea class="libre-translate-dialog__textarea" id="sourceText">${this.escapeHtml(initialText)}</textarea>
        </div>
        <div class="libre-translate-dialog__pane">
            <div class="libre-translate-dialog__pane-header">Translated Text</div>
            <textarea class="libre-translate-dialog__textarea" id="translatedText" readonly></textarea>
        </div>
    </div>
    <div class="libre-translate-dialog__footer">
        <div class="libre-translate-dialog__loading" id="loading">
            <svg class="fn__spin" style="width:16px;height:16px;"><use xlink:href="#iconLoading"></use></svg>
            <span>Loading...</span>
        </div>
        <div style="flex:1;"></div>
        <div class="libre-translate-dialog__buttons">
            <button class="b3-button" id="clearBtn">Clear</button>
            <button class="b3-button" id="copyBtn">Copy</button>
            <button class="b3-button b3-button--primary" id="replaceBtn">Replace</button>
        </div>
    </div>
</div>`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    private initEventListeners(): void {
        setTimeout(() => {
            this.sourceTextarea = document.getElementById("sourceText") as HTMLTextAreaElement;
            this.translatedTextarea = document.getElementById("translatedText") as HTMLTextAreaElement;
            this.sourceLangSelect = document.getElementById("sourceLang") as HTMLSelectElement;
            this.targetLangSelect = document.getElementById("targetLang") as HTMLSelectElement;
            this.translateButton = document.getElementById("translateBtn") as HTMLButtonElement;
            this.loadingElement = document.getElementById("loading") as HTMLDivElement;

            const swapBtn = document.getElementById("swapBtn");
            const clearBtn = document.getElementById("clearBtn");
            const copyBtn = document.getElementById("copyBtn");
            const replaceBtn = document.getElementById("replaceBtn");

            this.translateButton.addEventListener("click", () => this.translate());
            swapBtn?.addEventListener("click", () => this.swapLanguages());
            clearBtn?.addEventListener("click", () => this.clear());
            copyBtn?.addEventListener("click", () => this.copyToClipboard());
            replaceBtn?.addEventListener("click", () => this.replaceText());

            this.sourceLangSelect.value = this.settings.sourceLang;
            this.targetLangSelect.value = this.settings.targetLang;
        }, 0);
    }

    private async translate(): Promise<void> {
        const text = this.sourceTextarea?.value?.trim();
        if (!text) return;

        this.setLoading(true);

        try {
            const response = await this.translator.translate({
                text: text,
                source: this.sourceLangSelect?.value || "auto",
                target: this.targetLangSelect?.value || "en",
                format: "text"
            });

            if (this.translatedTextarea) {
                this.translatedTextarea.value = response.translatedText;
            }
        } catch (e) {
            showMessage(`Translation error: ${e instanceof Error ? e.message : "Unknown error"}`, 5000, "error");
        } finally {
            this.setLoading(false);
        }
    }

    private setLoading(loading: boolean): void {
        if (this.translateButton) {
            this.translateButton.disabled = loading;
        }
        if (this.loadingElement) {
            this.loadingElement.style.display = loading ? "flex" : "none";
        }
    }

    private swapLanguages(): void {
        if (!this.sourceLangSelect || !this.targetLangSelect) return;
        
        const temp = this.sourceLangSelect.value;
        this.sourceLangSelect.value = this.targetLangSelect.value;
        this.targetLangSelect.value = temp;

        if (this.sourceTextarea && this.translatedTextarea) {
            const tempText = this.sourceTextarea.value;
            this.sourceTextarea.value = this.translatedTextarea.value;
            this.translatedTextarea.value = tempText;
        }
    }

    private clear(): void {
        if (this.sourceTextarea) this.sourceTextarea.value = "";
        if (this.translatedTextarea) this.translatedTextarea.value = "";
    }

    private async copyToClipboard(): Promise<void> {
        const text = this.translatedTextarea?.value;
        if (!text?.trim()) return;

        try {
            await navigator.clipboard.writeText(text);
            showMessage("Copied to clipboard", 2000, "info");
        } catch (e) {
            console.error("Failed to copy:", e);
        }
    }

    private replaceText(): void {
        const translated = this.translatedTextarea?.value;
        const original = this.sourceTextarea?.value;

        if (!translated?.trim() || !original?.trim()) return;

        if (this.onReplaceCallback) {
            this.onReplaceCallback(original, translated);
        }

        this.dialog.destroy();
    }

    public destroy(): void {
        this.dialog.destroy();
    }
}

export default LibreTranslatePlugin;