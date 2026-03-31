import {
    Plugin,
    showMessage,
    Setting,
    fetchPost,
    Menu,
    getFrontend,
    openSetting,
    IOperation,
} from "siyuan";
import "./index.scss";
import { LibreTranslate, Language } from "./lib/translator";

const STORAGE_NAME = "config";

interface IConfig {
    apiUrl: string;
    apiKey: string;
    sourceLang: string;
    targetLang: string;
}

export default class LibreTranslatePlugin extends Plugin {
    private translator!: LibreTranslate;
    private languages: Language[] = [];
    private isMobile: boolean = false;
    private blockIconEventBindThis = this.blockIconEvent.bind(this);

    async onload() {
        this.data[STORAGE_NAME] = {
            apiUrl: "http://gaz-linux:5000",
            apiKey: "",
            sourceLang: "auto",
            targetLang: "ru",
        };

        await this.loadData(STORAGE_NAME).catch((e) => {
            console.error(`[${this.name}] load data [${STORAGE_NAME}] fail: `, e);
        });

        const config = this.data[STORAGE_NAME] as IConfig;
        this.translator = new LibreTranslate(config.apiUrl, config.apiKey);
        this.isMobile = getFrontend() === "mobile" || getFrontend() === "browser-mobile";

        this.addIcons(`<symbol id="iconTranslate" viewBox="0 0 32 32">
<path d="M12.5 8c-2.6 0-4.9 1.4-6.1 3.5l1.6 1.2C9 11.3 10.6 10.5 12.5 10.5c2.3 0 4.3 1.3 5.3 3.2l1.8-1.2C18.4 9.8 15.7 8 12.5 8zM5.7 12c0-1.2.3-2.3.9-3.3l-1.5-1.2C3.8 9.2 3 11 3 13c0 3.2 1.8 6 4.4 7.4l-1.4 1.9C4.3 20.4 3 17.9 3 15c0-1 .2-2 .5-2.9l1.8 1.1c-.2.6-.3 1.2-.3 1.8 0 .8.1 1.5.3 2.2l1.6-1c-.1-.4-.2-.8-.2-1.2 0-.7.2-1.3.5-1.9l-1.7-1.3c-.5.9-.8 2-.8 3.2zM26.3 12l-1.8-1.1c.2-.6.3-1.2.3-1.8 0-.8-.1-1.5-.3-2.2l-1.6-1c.1.4.2.8.2 1.2 0 .7-.2 1.3-.5 1.9l1.7-1.3c.5-.9.8-2 .8-3.2 0-1.2-.3-2.3-.9-3.3l1.5 1.2c1.3 1.6 2.1 3.8 2.1 6.1 0 2.8-1.3 5.2-3.3 6.8l-1.6-1.2c1.5-1.3 2.5-3.2 2.6-5.3zM12.5 16c-1.8 0-3.4.9-4.3 2.3l1.7 1.2c.5-1 1.7-1.7 3-1.7 1.2 0 2.2.5 2.8 1.3l1.7-1.3c-1-1.3-2.6-2.2-4.4-2.2h-.5v2.1c0 1.1-.9 2-2 2s-2-.9-2-2v-2.7h-1v2.7c0 1.7 1.3 3 3 3s3-1.3 3-3V16h-1z"/>
</symbol>`);

        this.addCommand({
            langKey: "openSettings",
            hotkey: "",
            callback: () => {
                openSetting(this.app);
            },
        });

        this.initSettings();

        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        this.loadLanguages();

        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);

        this.addTopBar({
            icon: "iconTranslate",
            title: this.i18n.settingsTitle,
            position: "right",
            callback: () => {
                openSetting(this.app);
            }
        });

        console.log(`[${this.name}] loaded`);
    }

    onunload() {
        this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        this.removeData(STORAGE_NAME).catch((e) => {
            showMessage(`uninstall [${this.name}] remove data [${STORAGE_NAME}] fail: ${e.msg}`);
        });
    }

    private initSettings() {
        const config = this.data[STORAGE_NAME] as IConfig;

        const urlInput = document.createElement("input");
        urlInput.type = "text";
        urlInput.className = "b3-text-field fn__block";
        urlInput.placeholder = this.i18n.settingsApiUrlPlaceholder;
        urlInput.value = config.apiUrl;

        const apiKeyInput = document.createElement("input");
        apiKeyInput.type = "password";
        apiKeyInput.className = "b3-text-field fn__block";
        apiKeyInput.placeholder = this.i18n.settingsApiKeyPlaceholder;
        apiKeyInput.value = config.apiKey;

        const sourceSelect = document.createElement("select");
        sourceSelect.className = "b3-select fn__block";

        const targetSelect = document.createElement("select");
        targetSelect.className = "b3-select fn__block";

        this.setting = new Setting({
            confirmCallback: () => {
                const newConfig: IConfig = {
                    apiUrl: urlInput.value.trim() || "http://gaz-linux:5000",
                    apiKey: apiKeyInput.value.trim(),
                    sourceLang: sourceSelect.value,
                    targetLang: targetSelect.value,
                };
                this.translator.setServerUrl(newConfig.apiUrl);
                this.translator.setApiKey(newConfig.apiKey);
                this.saveData(STORAGE_NAME, newConfig).then(() => {
                    showMessage(`[${this.name}] ${this.i18n.save}`, 2000);
                }).catch((e) => {
                    showMessage(`[${this.name}] save data fail: ${e}`, 3000, "error");
                });
            }
        });

        this.setting.addItem({
            title: this.i18n.settingsApiUrl,
            direction: "column",
            createActionElement: () => {
                return urlInput;
            },
        });

        this.setting.addItem({
            title: this.i18n.settingsApiKey,
            direction: "column",
            createActionElement: () => {
                return apiKeyInput;
            },
        });

        this.setting.addItem({
            title: this.i18n.settingsSourceLang,
            direction: "column",
            createActionElement: () => {
                sourceSelect.innerHTML = `<option value="auto">${this.i18n.settingsLangAuto}</option>`;
                return sourceSelect;
            },
        });

        this.setting.addItem({
            title: this.i18n.settingsTargetLang,
            direction: "column",
            createActionElement: () => {
                return targetSelect;
            },
        });

        this.updateLanguageDropdowns(sourceSelect, targetSelect, config.sourceLang, config.targetLang);
    }

    private async loadLanguages() {
        try {
            this.languages = await this.translator.getLanguages();
        } catch (error) {
            console.warn(`[${this.name}] Failed to load languages:`, error);
            this.languages = [];
        }
    }

    private updateLanguageDropdowns(sourceSelect: HTMLSelectElement, targetSelect: HTMLSelectElement, selectedSource: string, selectedTarget: string) {
        sourceSelect.innerHTML = `<option value="auto">${this.i18n.settingsLangAuto}</option>`;
        targetSelect.innerHTML = "";

        for (const lang of this.languages) {
            const sourceOption = document.createElement("option");
            sourceOption.value = lang.code;
            sourceOption.textContent = lang.name;
            if (lang.code === selectedSource) {
                sourceOption.selected = true;
            }
            sourceSelect.appendChild(sourceOption);

            if (lang.code !== "auto") {
                const targetOption = document.createElement("option");
                targetOption.value = lang.code;
                targetOption.textContent = lang.name;
                if (lang.code === selectedTarget) {
                    targetOption.selected = true;
                }
                targetSelect.appendChild(targetOption);
            }
        }
    }

    private async blockIconEvent({ detail }: { detail: { menu: Menu; blockElements: HTMLElement[]; protyle: unknown } }) {
        const blockElements = detail.blockElements;
        if (blockElements.length === 0) {
            return;
        }

        const blockId = blockElements[0].dataset.nodeId;
        if (!blockId) {
            return;
        }

        detail.menu.addItem({
            id: "libretranslate-translate",
            iconHTML: '<symbol id="iconTranslate"><path d="M12.5 8c-2.6 0-4.9 1.4-6.1 3.5l1.6 1.2C9 11.3 10.6 10.5 12.5 10.5c2.3 0 4.3 1.3 5.3 3.2l1.8-1.2C18.4 9.8 15.7 8 12.5 8zM5.7 12c0-1.2.3-2.3.9-3.3l-1.5-1.2C3.8 9.2 3 11 3 13c0 3.2 1.8 6 4.4 7.4l-1.4 1.9C4.3 20.4 3 17.9 3 15c0-1 .2-2 .5-2.9l1.8 1.1c-.2.6-.3 1.2-.3 1.8 0 .8.1 1.5.3 2.2l1.6-1c-.1-.4-.2-.8-.2-1.2 0-.7.2-1.3.5-1.9l-1.7-1.3c-.5.9-.8 2-.8 3.2zM26.3 12l-1.8-1.1c.2-.6.3-1.2.3-1.8 0-.8-.1-1.5-.3-2.2l-1.6-1c.1.4.2.8.2 1.2 0 .7-.2 1.3-.5 1.9l1.7-1.3c.5-.9.8-2 .8-3.2 0-1.2-.3-2.3-.9-3.3l1.5 1.2c1.3 1.6 2.1 3.8 2.1 6.1 0 2.8-1.3 5.2-3.3 6.8l-1.6-1.2c1.5-1.3 2.5-3.2 2.6-5.3zM12.5 16c-1.8 0-3.4.9-4.3 2.3l1.7 1.2c.5-1 1.7-1.7 3-1.7 1.2 0 2.2.5 2.8 1.3l1.7-1.3c-1-1.3-2.6-2.2-4.4-2.2h-.5v2.1c0 1.1-.9 2-2 2s-2-.9-2-2v-2.7h-1v2.7c0 1.7 1.3 3 3 3s3-1.3 3-3V16h-1z"></path></symbol>',
            label: this.i18n.translate,
            submenu: async () => {
                const loadingItem = document.createElement("div");
                loadingItem.className = "b3-menu__item";
                loadingItem.textContent = this.i18n.translateLoading;
                return [loadingItem];
            },
            click: async () => {
                await this.translateBlock(blockId, detail);
            },
        });
    }

    private async translateBlock(blockId: string, detail: { protyle: { getInstance: () => { transaction: (ops: IOperation[]) => void } } }) {
        const config = this.data[STORAGE_NAME] as IConfig;

        fetchPost("/api/block/getBlockKramdown", { id: blockId }, async (response: { data: { kramdown: string } }) => {
            const blockContent = response.data.kramdown;

            if (blockContent.length > 5000) {
                const proceed = confirm(this.i18n.largeBlockWarning);
                if (!proceed) {
                    return;
                }
            }

            try {
                const translated = await this.translator.translate({
                    text: blockContent,
                    source: config.sourceLang,
                    target: config.targetLang,
                    format: "text",
                });

                const menu = new Menu("translate-result", () => {});

                menu.addItem({
                    label: this.i18n.translatePreview,
                    type: "readonly",
                    iconHTML: `<div class="b3-menu__item fn__ellipsis" style="max-width: 300px;">${translated}</div>`,
                });

                menu.addItem({
                    icon: "iconRefresh",
                    label: this.i18n.translateReplace,
                    click: () => {
                        fetchPost("/api/block/getBlockKramdown", { id: blockId }, (res: { data: { kramdown: string; id: string } }) => {
                            const ops: IOperation[] = [{
                                id: res.data.id,
                                data: this.buildKramdownBlock(res.data.kramdown, translated),
                                action: "update",
                            }];
                            detail.protyle.getInstance().transaction(ops);
                            showMessage(`[${this.name}] ${this.i18n.translateSuccess}`, 2000);
                        });
                    },
                });

                menu.addItem({
                    icon: "iconCopy",
                    label: this.i18n.translateCopy,
                    click: async () => {
                        try {
                            await navigator.clipboard.writeText(translated);
                            showMessage(`[${this.name}] ${this.i18n.translateSuccess}`, 2000);
                        } catch (e) {
                            showMessage(`[${this.name}] ${this.i18n.translateError}`, 3000, "error");
                        }
                    },
                });

                const rect = document.querySelector(`[data-node-id="${blockId}"]`)?.getBoundingClientRect();
                if (rect) {
                    menu.open({
                        x: rect.right,
                        y: rect.bottom,
                    });
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                showMessage(`[${this.name}] ${errorMsg}`, 3000, "error");
            }
        });
    }

    private buildKramdownBlock(originalKramdown: string, translatedText: string): string {
        const ialMatch = originalKramdown.match(/^(\{:[^}]*\})\n/);
        if (ialMatch) {
            return ialMatch[1] + "\n" + translatedText;
        }
        return translatedText;
    }
}