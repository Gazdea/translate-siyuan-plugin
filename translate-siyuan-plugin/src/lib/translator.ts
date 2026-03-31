export interface Language {
    code: string;
    name: string;
    targets: string[];
}

export interface TranslateOptions {
    text: string;
    source: string;
    target: string;
    format?: "text" | "html";
    alternatives?: number;
    apiKey?: string;
}

export interface TranslateResponse {
    translatedText: string;
    detectedLanguage?: {
        confidence: number;
        language: string;
    };
    alternatives?: string[];
}

export interface LibreTranslateErrorResponse {
    error: string;
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
            const errorData = await this.parseErrorResponse(response);
            console.error("[LibreTranslate] Failed to get languages:", errorData);
            throw new LibreTranslateApiError(
                "Failed to load languages",
                `${response.status} ${response.statusText}`
            );
        }

        return await response.json() as Language[];
    } catch (e: any) {
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
                const errorData = await this.parseErrorResponse(response);
                console.error("[LibreTranslate] Failed to detect language:", errorData);
                throw new LibreTranslateApiError(
                    "Language detection failed",
                    `${response.status} ${response.statusText}`
                );
            }

            return await response.json() as {language: string; confidence: number}[];
        } catch (e: any) {
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

    public async translate(options: TranslateOptions): Promise<TranslateResponse> {
        try {
            const formData = new FormData();
            formData.append("q", options.text);
            formData.append("source", options.source);
            formData.append("target", options.target);
            formData.append("format", options.format || "text");
            if (options.alternatives !== undefined && options.alternatives > 0) {
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

            return await response.json() as TranslateResponse;
        } catch (e: any) {
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

    public async healthCheck(): Promise<boolean> {
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

    private getHeaders(): Record<string, string> {
        return {};
    }

    private async parseErrorResponse(response: Response): Promise<string> {
        try {
            const errorData = await response.json() as LibreTranslateErrorResponse;
            return errorData.error || response.statusText;
        } catch {
            return response.statusText;
        }
    }
}
