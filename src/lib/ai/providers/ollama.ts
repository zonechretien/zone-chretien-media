import type { AIProvider, GenerateOptions } from "../types";
import { AIProviderError } from "../types";

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3";

type OllamaResponse = { response?: string };

/**
 * Fournisseur réservé au développement local (voir CORRECTION 2 du cahier
 * des charges) : Ollama ne peut pas tourner sur les fonctions serverless de
 * Vercel. get-provider.ts refuse de le sélectionner en production.
 */
export class OllamaProvider implements AIProvider {
  readonly name = "ollama" as const;

  private get baseUrl(): string {
    return process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL;
  }

  private get model(): string {
    return process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const data = await this.call(prompt, undefined, options);
    return data.response ?? "";
  }

  async generateJSON(
    prompt: string,
    jsonSchema: Record<string, unknown>,
    options?: GenerateOptions,
  ): Promise<unknown> {
    const data = await this.call(prompt, jsonSchema, options);
    try {
      return JSON.parse(data.response ?? "");
    } catch (err) {
      throw new AIProviderError("Ollama n'a pas renvoyé un JSON valide.", "ollama", err);
    }
  }

  private async call(
    prompt: string,
    jsonSchema: Record<string, unknown> | undefined,
    options?: GenerateOptions,
  ): Promise<OllamaResponse> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: jsonSchema ?? undefined,
          options: {
            temperature: options?.temperature ?? 0.8,
            num_predict: options?.maxOutputTokens ?? 1024,
          },
        }),
      });
    } catch (err) {
      throw new AIProviderError(
        `Impossible de contacter Ollama sur ${this.baseUrl}. Le service est-il lancé (\`ollama serve\`) ?`,
        "ollama",
        err,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AIProviderError(`Erreur Ollama (HTTP ${response.status}) : ${body.slice(0, 200)}`, "ollama");
    }

    return (await response.json()) as OllamaResponse;
  }
}
