export type AIProviderName = "gemini" | "ollama";

export type GenerateOptions = {
  temperature?: number;
  maxOutputTokens?: number;
};

/**
 * Contrat commun implémenté par chaque moteur IA (Gemini, Ollama, …).
 * Le code appelant ne dépend jamais d'un moteur précis — voir get-provider.ts.
 */
export interface AIProvider {
  readonly name: AIProviderName;
  /** Génère du texte libre. */
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  /** Génère un objet JSON respectant `jsonSchema` (JSON Schema simplifié). */
  generateJSON(
    prompt: string,
    jsonSchema: Record<string, unknown>,
    options?: GenerateOptions,
  ): Promise<unknown>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: AIProviderName,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
