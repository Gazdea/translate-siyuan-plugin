"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const siyuan = require("siyuan");
class LibreTranslateApiError extends Error {
  constructor(userMessage, serverMessage = "") {
    super(serverMessage || userMessage);
    this.name = "LibreTranslateApiError";
    this.userMessage = userMessage;
    this.serverMessage = serverMessage;
  }
}
class LibreTranslate {
  constructor(baseUrl, apiKey = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }
  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, "");
  }
  setApiKey(key) {
    this.apiKey = key;
  }
  getBaseUrl() {
    return this.baseUrl;
  }
  async getLanguages() {
    try {
      const response = await fetch(`${this.baseUrl}/languages`, {
        method: "GET",
        headers: this.getHeaders()
      });
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        console.error("[LibreTranslate] Failed to get languages:", errorData);
        throw new LibreTranslateApiError(
          "Failed to load languages",
          `${response.status} ${response.statusText}`
        );
      }
      return await response.json();
    } catch (e) {
      if (e instanceof LibreTranslateApiError) {
        throw e;
      }
      console.error("[LibreTranslate] Network error getting languages:", e.message);
      throw new LibreTranslateApiError(
        "Failed to connect to translation server",
        e.message
      );
    }
  }
  async detectLanguage(text) {
    try {
      const formData = new FormData();
      formData.append("q", text);
      if (this.apiKey) {
        formData.append("api_key", this.apiKey);
      }
      const response = await fetch(`${this.baseUrl}/detect`, {
        method: "POST",
        body: formData,
        headers: this.getHeaders()
      });
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        console.error("[LibreTranslate] Failed to detect language:", errorData);
        throw new LibreTranslateApiError(
          "Language detection failed",
          `${response.status} ${response.statusText}`
        );
      }
      return await response.json();
    } catch (e) {
      if (e instanceof LibreTranslateApiError) {
        throw e;
      }
      console.error("[LibreTranslate] Network error detecting language:", e.message);
      throw new LibreTranslateApiError(
        "Failed to connect to translation server",
        e.message
      );
    }
  }
  async translate(options) {
    try {
      const formData = new FormData();
      formData.append("q", options.text);
      formData.append("source", options.source);
      formData.append("target", options.target);
      formData.append("format", options.format || "text");
      if (options.alternatives !== void 0 && options.alternatives > 0) {
        formData.append("alternatives", options.alternatives.toString());
      }
      if (this.apiKey) {
        formData.append("api_key", this.apiKey);
      }
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: "POST",
        body: formData,
        headers: this.getHeaders()
      });
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        console.error("[LibreTranslate] Translation error:", errorData);
        throw new LibreTranslateApiError(
          "Translation failed",
          `${response.status} ${response.statusText}`
        );
      }
      return await response.json();
    } catch (e) {
      if (e instanceof LibreTranslateApiError) {
        throw e;
      }
      console.error("[LibreTranslate] Network error during translation:", e.message);
      throw new LibreTranslateApiError(
        "Failed to connect to translation server",
        e.message
      );
    }
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: this.getHeaders()
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  getHeaders() {
    return {};
  }
  async parseErrorResponse(response) {
    try {
      const errorData = await response.json();
      return errorData.error || response.statusText;
    } catch {
      return response.statusText;
    }
  }
}
const DEFAULT_SETTINGS = {
  apiUrl: "http://localhost:5000",
  apiKey: "",
  sourceLang: "auto",
  targetLang: "ru",
  hotkey: "Ctrl+Shift+T"
};
class SettingsPanel {
  constructor(app, settings, onSave, i18n = {}) {
    this.languages = [];
    this.languagesLoaded = false;
    this.currentSettings = { ...settings };
    this.translator = new LibreTranslate(settings.apiUrl, settings.apiKey);
    this.onSaveCallback = onSave;
    this.i18n = i18n;
    this.setting = new siyuan.Setting({
      confirmCallback: () => {
        this.saveSettings();
      }
    });
    this.createSettingElements();
  }
  t(key) {
    return this.i18n[key] || key;
  }
  createSettingElements() {
    this.createApiUrlSetting();
    this.createApiKeySetting();
    this.createSourceLangSetting();
    this.createTargetLangSetting();
    this.createHotkeySetting();
    this.createTestConnectionButton();
  }
  createApiUrlSetting() {
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
  createApiKeySetting() {
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
  createSourceLangSetting() {
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
  createTargetLangSetting() {
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
  createHotkeySetting() {
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
  createTestConnectionButton() {
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
  async loadLanguages() {
    if (this.languagesLoaded) return;
    try {
      this.translator.setBaseUrl(this.apiUrlInput.value);
      this.translator.setApiKey(this.apiKeyInput.value);
      this.languages = await this.translator.getLanguages();
      const autoOption = `<option value="auto">${this.t("auto")}</option>`;
      const options = this.languages.map((lang) => `<option value="${lang.code}">${lang.name} (${lang.code})</option>`).join("");
      this.sourceLangSelect.innerHTML = autoOption + options;
      this.sourceLangSelect.value = this.currentSettings.sourceLang;
      this.targetLangSelect.innerHTML = options;
      this.targetLangSelect.value = this.currentSettings.targetLang;
      this.languagesLoaded = true;
    } catch (e) {
      console.error("Failed to load languages:", e);
    }
  }
  async testConnection() {
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
  saveSettings() {
    this.currentSettings = {
      apiUrl: this.apiUrlInput.value,
      apiKey: this.apiKeyInput.value,
      sourceLang: this.sourceLangSelect.value,
      targetLang: this.targetLangSelect.value,
      hotkey: this.hotkeyInput.value
    };
    this.onSaveCallback(this.currentSettings);
  }
  getSettingElement() {
    return this.setting.element;
  }
}
class TranslateDialog {
  constructor(options) {
    this.languages = [];
    this.currentProtyle = null;
    this.onReplaceCallback = null;
    this.settings = options.settings;
    this.translator = new LibreTranslate(options.settings.apiUrl, options.settings.apiKey);
    this.onReplaceCallback = options.onReplace || null;
    this.i18n = options.i18n || {};
    this.dialog = new siyuan.Dialog({
      title: this.t("translate"),
      width: "80%",
      maxWidth: "900px",
      height: "70vh",
      content: this.createDialogContent(options.initialText || "")
    });
    this.initEventListeners();
    this.loadLanguages();
  }
  t(key) {
    return this.i18n[key] || key;
  }
  createDialogContent(initialText) {
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
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  initEventListeners() {
    this.sourceTextarea = this.dialog.element.querySelector("#sourceText");
    this.translatedTextarea = this.dialog.element.querySelector("#translatedText");
    this.sourceLangSelect = this.dialog.element.querySelector("#sourceLang");
    this.targetLangSelect = this.dialog.element.querySelector("#targetLang");
    this.detectLabel = this.dialog.element.querySelector("#detectLabel");
    this.swapButton = this.dialog.element.querySelector("#swapBtn");
    this.translateButton = this.dialog.element.querySelector("#translateBtn");
    this.replaceButton = this.dialog.element.querySelector("#replaceBtn");
    this.copyButton = this.dialog.element.querySelector("#copyBtn");
    this.clearButton = this.dialog.element.querySelector("#clearBtn");
    this.loadingElement = this.dialog.element.querySelector("#loading");
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
  async loadLanguages() {
    var _a, _b;
    try {
      this.languages = await this.translator.getLanguages();
      this.updateLanguageSelectors();
    } catch (e) {
      console.error("[LibreTranslate] Failed to load languages:", e);
      const isConnectionError = ((_a = e.message) == null ? void 0 : _a.includes("fetch")) || ((_b = e.serverMessage) == null ? void 0 : _b.includes("Failed to fetch"));
      if (isConnectionError) {
        this.showError(this.t("serverNotAvailable") + " " + this.translator.getBaseUrl());
      } else {
        this.showError(this.t("error") + ": " + e.userMessage);
      }
      this.setDefaultLanguages();
    }
  }
  setDefaultLanguages() {
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
  updateLanguageSelectors() {
    const autoOption = `<option value="auto">${this.t("auto")}</option>`;
    const options = this.languages.map((lang) => `<option value="${lang.code}">${lang.name} (${lang.code})</option>`).join("");
    this.sourceLangSelect.innerHTML = autoOption + options;
    this.sourceLangSelect.value = this.settings.sourceLang;
    this.targetLangSelect.innerHTML = options;
    this.targetLangSelect.value = this.settings.targetLang;
  }
  async detectLanguage() {
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
    } catch (e) {
      console.error("[LibreTranslate] Language detection failed:", e);
    }
  }
  async translate() {
    const text = this.sourceTextarea.value.trim();
    if (!text) {
      return;
    }
    this.setButtonLoading(true);
    try {
      const response = await this.translator.translate({
        text,
        source: this.sourceLangSelect.value,
        target: this.targetLangSelect.value,
        format: "text"
      });
      this.translatedTextarea.value = response.translatedText;
      if (response.detectedLanguage) {
        this.detectLabel.textContent = `${this.t("languageDetected")} ${response.detectedLanguage.language.toUpperCase()}`;
      }
    } catch (e) {
      if (e instanceof LibreTranslateApiError) {
        const errorMsg = e.serverMessage ? `${e.userMessage} (${e.serverMessage})` : e.userMessage;
        this.showError(errorMsg);
      } else {
        this.showError(this.t("error") + ": " + e.message);
      }
    } finally {
      this.setButtonLoading(false);
    }
  }
  showError(message) {
    siyuan.showMessage(message, 5e3, "error");
  }
  swapLanguages() {
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
  replaceText() {
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
  async copyToClipboard() {
    const text = this.translatedTextarea.value;
    if (!text.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      siyuan.showMessage(this.t("copied"), 2e3, "info");
    } catch (e) {
      console.error("[LibreTranslate] Failed to copy:", e);
    }
  }
  clear() {
    this.sourceTextarea.value = "";
    this.translatedTextarea.value = "";
    this.detectLabel.textContent = "";
  }
  setButtonLoading(loading) {
    const btnText = this.translateButton.querySelector(".libre-translate-dialog__btn-text");
    const btnLoading = this.translateButton.querySelector(".libre-translate-dialog__btn-loading");
    if (btnText && btnLoading) {
      btnText.style.display = loading ? "none" : "inline";
      btnLoading.style.display = loading ? "inline-flex" : "none";
    }
    this.translateButton.disabled = loading;
    this.loadingElement.style.display = loading ? "flex" : "none";
  }
  destroy() {
    this.dialog.destroy();
  }
  setInitialText(text) {
    if (this.sourceTextarea) {
      this.sourceTextarea.value = text;
      if (this.sourceLangSelect.value === "auto") {
        this.detectLanguage();
      }
    }
  }
}
const STORAGE_NAME = "settings";
class LibreTranslatePlugin extends siyuan.Plugin {
  constructor(app) {
    super(app);
    this.settings = { ...DEFAULT_SETTINGS };
    this.settingsPanel = null;
    this.translateDialog = null;
    this.currentProtyle = null;
    this.selectedText = "";
    this.eventBusClickEditorContent = this.handleClickEditorContent.bind(this);
    this.eventBusPaste = this.handlePaste.bind(this);
  }
  async onload() {
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
    const editors = siyuan.getAllEditor();
    if (editors.length > 0) {
      this.currentProtyle = editors[0].protyle;
    }
    this.eventBus.on("switch-protyle", (detail) => {
      this.currentProtyle = detail.protyle;
    });
  }
  onunload() {
    this.eventBus.off("click-editorcontent", this.eventBusClickEditorContent);
    this.eventBus.off("paste", this.eventBusPaste);
  }
  uninstall() {
    this.removeData(STORAGE_NAME).catch((e) => {
      siyuan.showMessage(`uninstall [${this.name}] remove data [${STORAGE_NAME}] fail: ${e.msg}`);
    });
  }
  async loadSettings() {
    try {
      const data = await this.loadData(STORAGE_NAME);
      if (data) {
        this.settings = { ...DEFAULT_SETTINGS, ...data };
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }
  async saveSettings(settings) {
    this.settings = settings;
    this.translator.setBaseUrl(settings.apiUrl);
    this.translator.setApiKey(settings.apiKey);
    try {
      await this.saveData(STORAGE_NAME, settings);
    } catch (e) {
      siyuan.showMessage(`[${this.name}] save settings fail: ${e.message}`);
    }
  }
  openSetting() {
    const dialog = new siyuan.Dialog({
      title: `${this.i18n.pluginName} - ${this.i18n.settings}`,
      width: "600px",
      content: '<div class="libre-translate-settings" style="padding: 20px;"></div>'
    });
    const container = dialog.element.querySelector(".libre-translate-settings");
    if (container) {
      this.settingsPanel = new SettingsPanel(
        this.app,
        this.settings,
        (newSettings) => this.saveSettings(newSettings),
        this.i18n
      );
      container.appendChild(this.settingsPanel.getSettingElement());
      this.settingsPanel.loadLanguages();
    }
  }
  handleClickEditorContent(event) {
    var _a;
    const detail = event.detail;
    const menu = detail.menu;
    const selectedText = (_a = window.getSelection()) == null ? void 0 : _a.toString();
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
  handlePaste() {
  }
  translateSelection() {
    var _a;
    const selectedText = (_a = window.getSelection()) == null ? void 0 : _a.toString();
    if (!selectedText || !selectedText.trim()) {
      siyuan.showMessage(this.i18n.noText);
      return;
    }
    this.selectedText = selectedText;
    this.openTranslateDialog(selectedText);
  }
  openTranslateDialog(initialText = "") {
    if (this.translateDialog) {
      this.translateDialog.destroy();
    }
    const editors = siyuan.getAllEditor();
    let protyle = null;
    if (editors.length > 0) {
      protyle = editors[0].protyle;
    }
    this.translateDialog = new TranslateDialog({
      app: this.app,
      settings: this.settings,
      initialText,
      onReplace: (original, translated) => {
        this.replaceTextInEditor(original, translated, protyle);
      },
      i18n: this.i18n
    });
  }
  async replaceTextInEditor(original, translated, protyle) {
    if (!protyle) {
      const editors = siyuan.getAllEditor();
      if (editors.length > 0) {
        protyle = editors[0].protyle;
      }
    }
    if (!protyle) {
      siyuan.showMessage(this.i18n.noText);
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
      let blockElement = null;
      if (startContainer.nodeType === Node.TEXT_NODE) {
        let current = startContainer.parentElement;
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
        siyuan.showMessage("Cannot find block to replace");
        return;
      }
      const blockId = blockElement.dataset.nodeId;
      const editElement = blockElement.querySelector('[contenteditable="true"]');
      if (editElement) {
        const currentText = editElement.textContent || "";
        const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedOriginal, "g");
        const newText = currentText.replace(regex, translated);
        if (newText !== currentText) {
          editElement.textContent = newText;
          const doOperations = [];
          doOperations.push({
            id: blockId,
            data: editElement.outerHTML,
            action: "update"
          });
          protyle.getInstance().transaction(doOperations);
          siyuan.showMessage(this.i18n.replaced);
        }
      }
    } catch (e) {
      console.error("[LibreTranslate] Error replacing text:", e);
      siyuan.showMessage(`${this.i18n.error}: ${e.message}`);
    }
  }
  async updateCards(options) {
    options.cards.sort((a, b) => {
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
exports.default = LibreTranslatePlugin;
