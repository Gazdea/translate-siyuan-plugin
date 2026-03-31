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