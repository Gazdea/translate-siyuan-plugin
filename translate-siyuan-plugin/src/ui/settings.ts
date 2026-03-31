import {Setting} from "siyuan";
import {LibreTranslate, Language} from "../lib/translator";

export interface PluginSettings {
    apiUrl: string;
    apiKey: string;
    sourceLang: string;
    targetLang: string;
    hotkey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    apiUrl: "http://localhost:5000",
    apiKey: "",
    sourceLang: "auto",
    targetLang: "ru",
    hotkey: "Ctrl+Shift+T"
};

export class SettingsPanel {
    private setting: Setting;
    private translator: LibreTranslate;
    private languages: Language[] = [];
    private onSaveCallback: (settings: PluginSettings) => void;
    private currentSettings: PluginSettings;
    private i18n: Record<string, string>;

    private apiUrlInput: HTMLInputElement;
    private apiKeyInput: HTMLInputElement;
    private sourceLangSelect: HTMLSelectElement;
    private targetLangSelect: HTMLSelectElement;
    private hotkeyInput: HTMLInputElement;
    private testButton: HTMLButtonElement;
    private statusElement: HTMLDivElement;
    private languagesLoaded: boolean = false;

    constructor(
        app: any,
        settings: PluginSettings,
        onSave: (settings: PluginSettings) => void,
        i18n: Record<string, string> = {}
    ) {
        this.currentSettings = {...settings};
        this.translator = new LibreTranslate(settings.apiUrl, settings.apiKey);
        this.onSaveCallback = onSave;
        this.i18n = i18n;

        this.setting = new Setting({
            confirmCallback: () => {
                this.saveSettings();
            }
        });

        this.createSettingElements();
    }

    private t(key: string): string {
        return this.i18n[key] || key;
    }

    private createSettingElements(): void {
        this.createApiUrlSetting();
        this.createApiKeySetting();
        this.createSourceLangSetting();
        this.createTargetLangSetting();
        this.createHotkeySetting();
        this.createTestConnectionButton();
    }

    private createApiUrlSetting(): void {
        this.setting.addItem({
            title: this.t("apiUrl"),
            direction: "row",
            description: "LibreTranslate API URL",
            createActionElement: () => {
                this.apiUrlInput = document.createElement("input");
                this.apiUrlInput.className = "b3-text-field fn__block";
                this.apiUrlInput.type = "text";
                this.apiUrlInput.placeholder = this.t("apiUrlPlaceholder");
                this.apiUrlInput.value = this.currentSettings.apiUrl;
                return this.apiUrlInput;
            }
        });
    }

    private createApiKeySetting(): void {
        this.setting.addItem({
            title: this.t("apiKey"),
            direction: "row",
            description: "Optional API key for LibreTranslate",
            createActionElement: () => {
                this.apiKeyInput = document.createElement("input");
                this.apiKeyInput.className = "b3-text-field fn__block";
                this.apiKeyInput.type = "password";
                this.apiKeyInput.placeholder = this.t("apiKeyPlaceholder");
                this.apiKeyInput.value = this.currentSettings.apiKey;
                return this.apiKeyInput;
            }
        });
    }

    private createSourceLangSetting(): void {
        this.setting.addItem({
            title: this.t("sourceLang"),
            direction: "row",
            description: this.t("auto"),
            createActionElement: () => {
                this.sourceLangSelect = document.createElement("select");
                this.sourceLangSelect.className = "b3-select fn__block";
                this.sourceLangSelect.innerHTML = `<option value="auto">${this.t("auto")}</option>`;
                this.sourceLangSelect.value = this.currentSettings.sourceLang;
                return this.sourceLangSelect;
            }
        });
    }

    private createTargetLangSetting(): void {
        this.setting.addItem({
            title: this.t("targetLang"),
            direction: "row",
            description: "Target language for translation",
            createActionElement: () => {
                this.targetLangSelect = document.createElement("select");
                this.targetLangSelect.className = "b3-select fn__block";
                this.targetLangSelect.value = this.currentSettings.targetLang;
                return this.targetLangSelect;
            }
        });
    }

    private createHotkeySetting(): void {
        this.setting.addItem({
            title: this.t("hotkey"),
            direction: "row",
            description: "Keyboard shortcut for translation",
            createActionElement: () => {
                this.hotkeyInput = document.createElement("input");
                this.hotkeyInput.className = "b3-text-field fn__block";
                this.hotkeyInput.type = "text";
                this.hotkeyInput.placeholder = this.t("hotkeyPlaceholder");
                this.hotkeyInput.value = this.currentSettings.hotkey;
                return this.hotkeyInput;
            }
        });
    }

    private createTestConnectionButton(): void {
        this.testButton = document.createElement("button");
        this.testButton.className = "b3-button b3-button--outline fn__flex-center";
        this.testButton.textContent = this.t("testConnection");
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

            const autoOption = `<option value="auto">${this.t("auto")}</option>`;
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
        this.statusElement.textContent = this.t("loading");
        this.statusElement.className = "fn__flex-center fn__margin-top";

        try {
            this.translator.setBaseUrl(this.apiUrlInput.value);
            this.translator.setApiKey(this.apiKeyInput.value);

            const isHealthy = await this.translator.healthCheck();

            if (isHealthy) {
                this.statusElement.textContent = this.t("connectionOk");
                this.statusElement.className = "fn__flex-center fn__margin-top fn__success";
                await this.loadLanguages();
            } else {
                this.statusElement.textContent = this.t("connectionError");
                this.statusElement.className = "fn__flex-center fn__margin-top fn__error";
            }
        } catch (e) {
            this.statusElement.textContent = this.t("connectionError");
            this.statusElement.className = "fn__flex-center fn__margin-top fn__error";
        }
    }

    private saveSettings(): void {
        this.currentSettings = {
            apiUrl: this.apiUrlInput.value,
            apiKey: this.apiKeyInput.value,
            sourceLang: this.sourceLangSelect.value,
            targetLang: this.targetLangSelect.value,
            hotkey: this.hotkeyInput.value
        };
        this.onSaveCallback(this.currentSettings);
    }

    public getSettingElement(): HTMLElement {
        return this.setting.element;
    }
}
