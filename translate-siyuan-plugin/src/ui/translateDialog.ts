import {Dialog, Protyle, showMessage} from "siyuan";
import {LibreTranslate, Language, LibreTranslateApiError} from "../lib/translator";
import {PluginSettings} from "./settings";

export interface TranslateDialogOptions {
    app: any;
    settings: PluginSettings;
    initialText?: string;
    onReplace?: (original: string, translated: string) => void;
    i18n?: Record<string, string>;
}

export class TranslateDialog {
    private dialog: Dialog;
    private translator: LibreTranslate;
    private settings: PluginSettings;
    private languages: Language[] = [];
    private currentProtyle: Protyle | null = null;
    private onReplaceCallback: ((original: string, translated: string) => void) | null = null;
    private i18n: Record<string, string>;

    private sourceTextarea: HTMLTextAreaElement;
    private translatedTextarea: HTMLTextAreaElement;
    private sourceLangSelect: HTMLSelectElement;
    private targetLangSelect: HTMLSelectElement;
    private detectLabel: HTMLSpanElement;
    private swapButton: HTMLButtonElement;
    private translateButton: HTMLButtonElement;
    private replaceButton: HTMLButtonElement;
    private copyButton: HTMLButtonElement;
    private clearButton: HTMLButtonElement;
    private loadingElement: HTMLDivElement;

    constructor(options: TranslateDialogOptions) {
        this.settings = options.settings;
        this.translator = new LibreTranslate(options.settings.apiUrl, options.settings.apiKey);
        this.onReplaceCallback = options.onReplace || null;
        this.i18n = options.i18n || {};

        this.dialog = new Dialog({
            title: this.t("translate") + " v1.0.0",
            width: "80%",
            maxWidth: "900px",
            height: "70vh",
            content: this.createDialogContent(options.initialText || "")
        });

        this.initEventListeners();
        this.loadLanguages();
    }

    private t(key: string): string {
        return this.i18n[key] || key;
    }

    private createDialogContent(initialText: string): string {
        return `
<div class="libre-translate-dialog">
    <div class="libre-translate-dialog__header">
        <div class="libre-translate-dialog__langs">
            <div class="libre-translate-dialog__lang">
                <label>${this.t("sourceLang")}</label>
                <select class="b3-select" id="sourceLang">${this.t("auto")}</select>
                <span class="libre-translate-dialog__detect" id="detectLabel"></span>
            </div>
            <button class="b3-button b3-button--outline" id="swapBtn" title="${this.t("swap")}">
                <svg><use xlink:href="#iconSwap"></use></svg>
            </button>
            <div class="libre-translate-dialog__lang">
                <label>${this.t("targetLang")}</label>
                <select class="b3-select" id="targetLang"></select>
            </div>
        </div>
        <div class="libre-translate-dialog__actions">
            <button class="b3-button b3-button--primary" id="translateBtn">
                <span class="libre-translate-dialog__btn-text">${this.t("translate")}</span>
                <span class="libre-translate-dialog__btn-loading">
                    <svg class="fn__spin"><use xlink:href="#iconLoading"></use></svg>
                </span>
            </button>
        </div>
    </div>
    <div class="libre-translate-dialog__body">
        <div class="libre-translate-dialog__pane">
            <div class="libre-translate-dialog__pane-header">${this.t("sourceText")}</div>
            <textarea class="libre-translate-dialog__textarea" id="sourceText" placeholder="${this.t("sourceText")}">${this.escapeHtml(initialText)}</textarea>
        </div>
        <div class="libre-translate-dialog__pane">
            <div class="libre-translate-dialog__pane-header">${this.t("translatedText")}</div>
            <textarea class="libre-translate-dialog__textarea" id="translatedText" placeholder="${this.t("translatedText")}" readonly></textarea>
        </div>
    </div>
    <div class="libre-translate-dialog__footer">
        <div class="libre-translate-dialog__loading" id="loading">
            <svg class="fn__spin"><use xlink:href="#iconLoading"></use></svg>
            <span>${this.t("loading")}</span>
        </div>
        <div class="libre-translate-dialog__buttons">
            <button class="b3-button" id="clearBtn">${this.t("clear")}</button>
            <button class="b3-button" id="copyBtn">${this.t("copy")}</button>
            <button class="b3-button b3-button--primary" id="replaceBtn">${this.t("replace")}</button>
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
        this.sourceTextarea = this.dialog.element.querySelector("#sourceText") as HTMLTextAreaElement;
        this.translatedTextarea = this.dialog.element.querySelector("#translatedText") as HTMLTextAreaElement;
        this.sourceLangSelect = this.dialog.element.querySelector("#sourceLang") as HTMLSelectElement;
        this.targetLangSelect = this.dialog.element.querySelector("#targetLang") as HTMLSelectElement;
        this.detectLabel = this.dialog.element.querySelector("#detectLabel") as HTMLSpanElement;
        this.swapButton = this.dialog.element.querySelector("#swapBtn") as HTMLButtonElement;
        this.translateButton = this.dialog.element.querySelector("#translateBtn") as HTMLButtonElement;
        this.replaceButton = this.dialog.element.querySelector("#replaceBtn") as HTMLButtonElement;
        this.copyButton = this.dialog.element.querySelector("#copyBtn") as HTMLButtonElement;
        this.clearButton = this.dialog.element.querySelector("#clearBtn") as HTMLButtonElement;
        this.loadingElement = this.dialog.element.querySelector("#loading") as HTMLDivElement;

        this.sourceTextarea.addEventListener("input", () => {
            if (this.sourceLangSelect.value === "auto") {
                this.detectLanguage();
            }
        });

        this.translateButton.addEventListener("click", () => this.translate());
        this.swapButton.addEventListener("click", () => this.swapLanguages());
        this.replaceButton.addEventListener("click", () => this.replaceText());
        this.copyButton.addEventListener("click", () => this.copyToClipboard());
        this.clearButton.addEventListener("click", () => this.clear());

        this.sourceTextarea.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.translate();
            }
        });
    }

    private async loadLanguages(): Promise<void> {
        try {
            this.languages = await this.translator.getLanguages();
            this.updateLanguageSelectors();
        } catch (e: any) {
            console.error("[LibreTranslate] Failed to load languages:", e);
            const isConnectionError = e.message?.includes("fetch") || e.serverMessage?.includes("Failed to fetch");
            if (isConnectionError) {
                this.showError(this.t("serverNotAvailable") + " " + this.translator.getBaseUrl());
            } else {
                this.showError(this.t("error") + ": " + e.userMessage);
            }
            this.setDefaultLanguages();
        }
    }

    private setDefaultLanguages(): void {
        const autoOption = `<option value="auto">${this.t("auto")}</option>`;
        const defaultOptions = `
            <option value="en">English (en)</option>
            <option value="ru">Russian (ru)</option>
            <option value="zh">Chinese (zh)</option>
            <option value="es">Spanish (es)</option>
            <option value="fr">French (fr)</option>
            <option value="de">German (de)</option>
        `;
        
        this.sourceLangSelect.innerHTML = autoOption + defaultOptions;
        this.sourceLangSelect.value = "auto";
        this.targetLangSelect.innerHTML = defaultOptions;
        this.targetLangSelect.value = this.settings.targetLang || "ru";
    }

    private updateLanguageSelectors(): void {
        const autoOption = `<option value="auto">${this.t("auto")}</option>`;
        const options = this.languages
            .map(lang => `<option value="${lang.code}">${lang.name} (${lang.code})</option>`)
            .join("");

        this.sourceLangSelect.innerHTML = autoOption + options;
        this.sourceLangSelect.value = this.settings.sourceLang;

        this.targetLangSelect.innerHTML = options;
        this.targetLangSelect.value = this.settings.targetLang;
    }

    private async detectLanguage(): Promise<void> {
        const text = this.sourceTextarea.value.trim();
        if (!text) {
            this.detectLabel.textContent = "";
            return;
        }

        try {
            const result = await this.translator.detectLanguage(text);
            if (result && result.length > 0) {
                const detected = result[0];
                this.detectLabel.textContent = `${this.t("languageDetected")} ${detected.language.toUpperCase()} (${Math.round(detected.confidence)}%)`;
            }
        } catch (e: any) {
            console.error("[LibreTranslate] Language detection failed:", e);
        }
    }

    private async translate(): Promise<void> {
        const text = this.sourceTextarea.value.trim();
        if (!text) {
            return;
        }

        this.setButtonLoading(true);

        try {
            const response = await this.translator.translate({
                text: text,
                source: this.sourceLangSelect.value,
                target: this.targetLangSelect.value,
                format: "text"
            });

            this.translatedTextarea.value = response.translatedText;

            if (response.detectedLanguage) {
                this.detectLabel.textContent = `${this.t("languageDetected")} ${response.detectedLanguage.language.toUpperCase()}`;
            }
        } catch (e: any) {
            if (e instanceof LibreTranslateApiError) {
                const errorMsg = e.serverMessage 
                    ? `${e.userMessage} (${e.serverMessage})`
                    : e.userMessage;
                this.showError(errorMsg);
            } else {
                this.showError(this.t("error") + ": " + e.message);
            }
        } finally {
            this.setButtonLoading(false);
        }
    }

    private showError(message: string): void {
        showMessage(message, 5000, "error");
    }

    private swapLanguages(): void {
        const sourceLang = this.sourceLangSelect.value;
        const targetLang = this.targetLangSelect.value;
        const sourceText = this.sourceTextarea.value;
        const translatedText = this.translatedTextarea.value;

        this.sourceLangSelect.value = targetLang;
        this.targetLangSelect.value = sourceLang;
        this.sourceTextarea.value = translatedText;
        this.translatedTextarea.value = sourceText;

        if (translatedText.trim()) {
            this.translate();
        }
    }

    private replaceText(): void {
        const original = this.sourceTextarea.value;
        const translated = this.translatedTextarea.value;

        if (!translated.trim()) {
            return;
        }

        if (this.onReplaceCallback) {
            this.onReplaceCallback(original, translated);
        }

        this.dialog.destroy();
    }

    private async copyToClipboard(): Promise<void> {
        const text = this.translatedTextarea.value;
        if (!text.trim()) {
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            showMessage(this.t("copied"), 2000, "info");
        } catch (e) {
            console.error("[LibreTranslate] Failed to copy:", e);
        }
    }

    private clear(): void {
        this.sourceTextarea.value = "";
        this.translatedTextarea.value = "";
        this.detectLabel.textContent = "";
    }

    private setButtonLoading(loading: boolean): void {
        const btnText = this.translateButton.querySelector(".libre-translate-dialog__btn-text") as HTMLElement;
        const btnLoading = this.translateButton.querySelector(".libre-translate-dialog__btn-loading") as HTMLElement;
        
        if (btnText && btnLoading) {
            btnText.style.display = loading ? "none" : "inline";
            btnLoading.style.display = loading ? "inline-flex" : "none";
        }
        
        this.translateButton.disabled = loading;
        this.loadingElement.style.display = loading ? "flex" : "none";
    }

    public destroy(): void {
        this.dialog.destroy();
    }

    public setInitialText(text: string): void {
        if (this.sourceTextarea) {
            this.sourceTextarea.value = text;
            if (this.sourceLangSelect.value === "auto") {
                this.detectLanguage();
            }
        }
    }
}
