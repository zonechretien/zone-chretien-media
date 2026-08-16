import type { AIProvider, GenerateOptions } from "../types";
import { AIProviderError } from "../types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
};

/**
 * Fournisseur de production par défaut (tier gratuit, aucune carte bancaire).
 * Clé requise : GEMINI_API_KEY (voir .env.example pour l'obtenir).
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const;

  private get apiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new AIProviderError(
        "GEMINI_API_KEY est manquante. Ajoutez-la dans votre fichier .env (voir .env.example).",
        "gemini",
      );
    }
    return key;
  }

  private get model(): string {
    return process.env.GEMINI_MODEL || DEFAULT_MODEL;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const data = await this.call(prompt, undefined, options);
    return this.extractText(data);
  }

  async generateJSON(
    prompt: string,
    jsonSchema: Record<string, unknown>,
    options?: GenerateOptions,
  ): Promise<unknown> {
    const data = await this.call(prompt, jsonSchema, options);
    const text = this.extractText(data);
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new AIProviderError(
        "Gemini n'a pas renvoyé un JSON valide.",
        "gemini",
        err,
      );
    }
  }

  private async call(
    prompt: string,
    jsonSchema: Record<string, unknown> | undefined,
    options?: GenerateOptions,
  ): Promise<GeminiResponse> {
    const url = `${API_BASE}/${this.model}:generateContent`;

    const generationConfig: Record<string, unknown> = {
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxOutputTokens ?? 1024,
    };
    if (jsonSchema) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = jsonSchema;
    }

    const apiKey = this.apiKey; // peut lever AIProviderError (clé manquante) — hors du try réseau ci-dessous

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        }),
      });
    } catch (err) {
      throw new AIProviderError("Impossible de contacter l'API Gemini.", "gemini", err);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (response.status === 429) {
        throw new AIProviderError(
          "Quota Gemini (tier gratuit) atteint. Réessayez dans quelques instants.",
          "gemini",
        );
      }
      if (response.status === 400 || response.status === 403) {
        throw new AIProviderError(
          "Clé GEMINI_API_KEY invalide ou refusée par Google. Vérifiez votre fichier .env.",
          "gemini",
        );
      }
      throw new AIProviderError(
        `Erreur Gemini (HTTP ${response.status}) : ${body.slice(0, 200)}`,
        "gemini",
      );
    }

    return (await response.json()) as GeminiResponse;
  }

  private extractText(data: GeminiResponse): string {
    if (data.promptFeedback?.blockReason) {
      throw new AIProviderError(
        `Contenu bloqué par Gemini (${data.promptFeedback.blockReason}). Reformulez votre demande.`,
        "gemini",
      );
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AIProviderError("Gemini a renvoyé une réponse vide.", "gemini");
    }
    return text;
  }
}
