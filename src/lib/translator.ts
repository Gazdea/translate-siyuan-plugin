export interface Language {
    code: string;
    name: string;
    targets?: string[];
}

export interface TranslateOptions {
    text: string;
    source: string;
    target: string;
    format?: "text" | "html";
}

export interface TranslateResponse {
    translatedText: string;
    detectedLanguage?: {
        confidence: number;
        language: string;
    };
}

export class LibreTranslateApiError extends Error {
    public readonly userMessage: string;
    public readonly serverMessage: string;

    constructor(userMessage: string, serverMessage: string = "") {
        super(serverMessage || userMessage);
        this.name = "LibreTranslateApiError";
        this.userMessage = userMessage;
        this.serverMessage = serverMessage;
    }
}

export class LibreTranslate {
    private baseUrl: string;
    private apiKey: string;

    constructor(baseUrl: string, apiKey: string = "") {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
    }

    public setBaseUrl(url: string): void {
        this.baseUrl = url.replace(/\/$/, "");
    }

    public setApiKey(key: string): void {
        this.apiKey = key;
    }

    public async getLanguages(): Promise<Language[]> {
        try {
            const response = await fetch(`${this.baseUrl}/languages`, {
                method: "GET",
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new LibreTranslateApiError(
                    "Failed to load languages",
                    `${response.status} ${response.statusText}`
                );
            }

            return await response.json() as Language[];
        } catch (e) {
            if (e instanceof LibreTranslateApiError) {
                throw e;
            }
            const message = e instanceof Error ? e.message : "Unknown error";
            throw new LibreTranslateApiError(
                "Failed to connect to translation server",
                message
            );
        }
    }

    public async detectLanguage(text: string): Promise<{language: string; confidence: number}[]> {
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
                throw new LibreTranslateApiError(
                    "Language detection failed",
                    `${response.status} ${response.statusText}`
                );
            }

            return await response.json() as {language: string; confidence: number}[];
        } catch (e) {
            if (e instanceof LibreTranslateApiError) {
                throw e;
            }
            const message = e instanceof Error ? e.message : "Unknown error";
            throw new LibreTranslateApiError(
                "Failed to connect to translation server",
                message
            );
        }
    }

    public async translate(options: TranslateOptions): Promise<TranslateResponse> {
        try {
            const formData = new FormData();
            formData.append("q", options.text);
            formData.append("source", options.source);
            formData.append("target", options.target);
            formData.append("format", options.format || "text");
            if (this.apiKey) {
                formData.append("api_key", this.apiKey);
            }

            const response = await fetch(`${this.baseUrl}/translate`, {
                method: "POST",
                body: formData,
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as {error?: string};
                throw new LibreTranslateApiError(
                    errorData.error || "Translation failed",
                    `${response.status} ${response.statusText}`
                );
            }

            return await response.json() as TranslateResponse;
        } catch (e) {
            if (e instanceof LibreTranslateApiError) {
                throw e;
            }
            const message = e instanceof Error ? e.message : "Unknown error";
            throw new LibreTranslateApiError(
                "Failed to connect to translation server",
                message
            );
        }
    }

    public async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/languages`, {
                method: "GET",
                headers: this.getHeaders()
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }
}