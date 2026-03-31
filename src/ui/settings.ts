import {Setting} from "siyuan";
import {LibreTranslate, Language} from "../lib/translator";

export interface PluginSettings {
    apiUrl: string;
    apiKey: string;
    sourceLang: string;
    targetLang: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    apiUrl: "http://localhost:5000",
    apiKey: "",
    sourceLang: "auto",
    targetLang: "en"
};

export class SettingsPanel {
    private setting: Setting;
    private translator: LibreTranslate;
    private languages: Language[] = [];
    private onSaveCallback: (settings: PluginSettings) => void;
    private currentSettings: PluginSettings;

    private apiUrlInput: HTMLInputElement;
    private apiKeyInput: HTMLInputElement;
    private sourceLangSelect: HTMLSelectElement;
    private targetLangSelect: HTMLSelectElement;
    private testButton: HTMLButtonElement;
    private statusElement: HTMLDivElement;
    private languagesLoaded: boolean = false;

    constructor(
        app: any,
        settings: PluginSettings,
        onSave: (settings: PluginSettings) => void
    ) {
        this.currentSettings = {...settings};
        this.translator = new LibreTranslate(settings.apiUrl, settings.apiKey);
        this.onSaveCallback = onSave;

        this.setting = new Setting({
            confirmCallback: () => {
                this.saveSettings();
            }
        });

        this.createSettingElements();
    }

    private createSettingElements(): void {
        this.createApiUrlSetting();
        this.createApiKeySetting();
        this.createSourceLangSetting();
        this.createTargetLangSetting();
        this.createTestConnectionButton();
    }

    private createApiUrlSetting(): void {
        this.setting.addItem({
            title: this.getI18n("apiUrl"),
            direction: "row",
            description: this.getI18n("apiUrlDesc"),
            createActionElement: () => {
                this.apiUrlInput = document.createElement("input");
                this.apiUrlInput.className = "b3-text-field fn__block";
                this.apiUrlInput.type = "text";
                this.apiUrlInput.placeholder = this.getI18n("apiUrlPlaceholder");
                this.apiUrlInput.value = this.currentSettings.apiUrl;
                return this.apiUrlInput;
            }
        });
    }

    private createApiKeySetting(): void {
        this.setting.addItem({
            title: this.getI18n("apiKey"),
            direction: "row",
            description: this.getI18n("apiKeyDesc"),
            createActionElement: () => {
                this.apiKeyInput = document.createElement("input");
                this.apiKeyInput.className = "b3-text-field fn__block";
                this.apiKeyInput.type = "password";
                this.apiKeyInput.placeholder = this.getI18n("apiKeyPlaceholder");
                this.apiKeyInput.value = this.currentSettings.apiKey;
                return this.apiKeyInput;
            }
        });
    }

    private createSourceLangSetting(): void {
        this.setting.addItem({
            title: this.getI18n("sourceLang"),
            direction: "row",
            description: this.getI18n("sourceLangDesc"),
            createActionElement: () => {
                this.sourceLangSelect = document.createElement("select");
                this.sourceLangSelect.className = "b3-select fn__block";
                this.sourceLangSelect.innerHTML = `<option value="auto">${this.getI18n("auto")}</option>`;
                this.sourceLangSelect.value = this.currentSettings.sourceLang;
                return this.sourceLangSelect;
            }
        });
    }

    private createTargetLangSetting(): void {
        this.setting.addItem({
            title: this.getI18n("targetLang"),
            direction: "row",
            description: this.getI18n("targetLangDesc"),
            createActionElement: () => {
                this.targetLangSelect = document.createElement("select");
                this.targetLangSelect.className = "b3-select fn__block";
                this.targetLangSelect.value = this.currentSettings.targetLang;
                return this.targetLangSelect;
            }
        });
    }

    private createTestConnectionButton(): void {
        this.testButton = document.createElement("button");
        this.testButton.className = "b3-button b3-button--outline fn__flex-center";
        this.testButton.textContent = this.getI18n("testConnection");
        this.testButton.addEventListener("click", () => this.testConnection());

        this.statusElement = document.createElement("div");
        this.statusElement.className = "fn__flex-center fn__margin-top";

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "fn__flex fn__flex-center fn__margin-top fn__space";
        buttonContainer.appendChild(this.testButton);
        buttonContainer.appendChild(this.statusElement);

        this.setting.addItem({
            title: "",
            direction: "row",
            createActionElement: () => buttonContainer
        });
    }

    public async loadLanguages(): Promise<void> {
        if (this.languagesLoaded) return;

        try {
            this.translator.setBaseUrl(this.apiUrlInput.value);
            this.translator.setApiKey(this.apiKeyInput.value);
            this.languages = await this.translator.getLanguages();

            const autoOption = `<option value="auto">${this.getI18n("auto")}</option>`;
            const options = this.languages
                .map(lang => `<option value="${lang.code}">${lang.name} (${lang.code})</option>`)
                .join("");

            this.sourceLangSelect.innerHTML = autoOption + options;
            this.sourceLangSelect.value = this.currentSettings.sourceLang;

            this.targetLangSelect.innerHTML = options;
            this.targetLangSelect.value = this.currentSettings.targetLang;

            this.languagesLoaded = true;
        } catch (e) {
            console.error("Failed to load languages:", e);
        }
    }

    private async testConnection(): Promise<void> {
        this.statusElement.textContent = this.getI18n("loading");
        this.statusElement.className = "fn__flex-center fn__margin-top";

        try {
            this.translator.setBaseUrl(this.apiUrlInput.value);
            this.translator.setApiKey(this.apiKeyInput.value);

            const isHealthy = await this.translator.healthCheck();

            if (isHealthy) {
                this.statusElement.textContent = this.getI18n("connectionOk");
                this.statusElement.className = "fn__flex-center fn__margin-top fn__success";
                await this.loadLanguages();
            } else {
                this.statusElement.textContent = this.getI18n("connectionError");
                this.statusElement.className = "fn__flex-center fn__margin-top fn__error";
            }
        } catch (e) {
            this.statusElement.textContent = this.getI18n("connectionError");
            this.statusElement.className = "fn__flex-center fn__margin-top fn__error";
        }
    }

    private saveSettings(): void {
        this.currentSettings = {
            apiUrl: this.apiUrlInput.value,
            apiKey: this.apiKeyInput.value,
            sourceLang: this.sourceLangSelect.value,
            targetLang: this.targetLangSelect.value
        };
        this.onSaveCallback(this.currentSettings);
    }

    public getSettingElement(): HTMLElement {
        return this.setting.element;
    }

    private getI18n(key: string): string {
        return (window as any).i18n?.[key] || key;
    }
}