export interface Language {
    code: string;
    name: string;
}

export interface TranslateOptions {
    text: string;
    source: string;
    target: string;
    format?: string;
}

export class LibreTranslate {
    private serverUrl: string;
    private apiKey: string;
    private timeout: number;

    constructor(serverUrl: string, apiKey: string = "", timeout: number = 30000) {
        this.serverUrl = serverUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
        this.timeout = timeout;
    }

    setServerUrl(url: string): void {
        this.serverUrl = url.replace(/\/$/, "");
    }

    setApiKey(key: string): void {
        this.apiKey = key;
    }

    async translate(options: TranslateOptions): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.serverUrl}/translate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    q: options.text,
                    source: options.source || "auto",
                    target: options.target,
                    format: options.format || "text",
                    api_key: this.apiKey || undefined,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.translatedText || "";
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new Error("Request timeout");
                }
                if (error.message.includes("fetch")) {
                    throw new Error("Connection refused - is LibreTranslate server running?");
                }
                throw error;
            }
            throw new Error("Unknown error during translation");
        }
    }

    async getLanguages(): Promise<Language[]> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.serverUrl}/languages`, {
                method: "GET",
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.map((item: { code: string; name: string }) => ({
                code: item.code,
                name: item.name,
            }));
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error("Request timeout");
            }
            throw error;
        }
    }
}