import { getAIProvider } from "./get-provider";
import { AIProviderError } from "./types";
import * as prompts from "./prompts";
import {
  devotionDraftJsonSchema,
  devotionDraftSchema,
  type DevotionDraft,
  prayerDraftJsonSchema,
  prayerDraftSchema,
  type PrayerDraft,
  verseDraftJsonSchema,
  verseDraftSchema,
  type VerseDraft,
  inspirationDraftJsonSchema,
  inspirationDraftSchema,
  type InspirationDraft,
  textDraftJsonSchema,
  textDraftSchema,
} from "./schemas";

async function generateStructured<T>(
  prompt: string,
  jsonSchema: Record<string, unknown>,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const provider = await getAIProvider();
  let raw: unknown;
  try {
    raw = await provider.generateJSON(prompt, jsonSchema);
  } catch (err) {
    if (err instanceof AIProviderError) throw err;
    throw new AIProviderError("Échec de la génération IA.", "gemini", err);
  }

  try {
    return schema.parse(raw);
  } catch (err) {
    throw new AIProviderError(
      "La réponse de l'IA ne correspond pas au format attendu. Réessayez.",
      provider.name,
      err,
    );
  }
}

export function generateDevotion(topic?: string): Promise<DevotionDraft> {
  return generateStructured(prompts.devotionPrompt(topic), devotionDraftJsonSchema, devotionDraftSchema);
}

export function generatePrayer(categoryLabel: string, topic?: string): Promise<PrayerDraft> {
  return generateStructured(
    prompts.prayerPrompt(categoryLabel, topic),
    prayerDraftJsonSchema,
    prayerDraftSchema,
  );
}

export function generateVerse(theme?: string): Promise<VerseDraft> {
  return generateStructured(prompts.versePrompt(theme), verseDraftJsonSchema, verseDraftSchema);
}

export function generateInspiration(topic?: string): Promise<InspirationDraft> {
  return generateStructured(
    prompts.inspirationPrompt(topic),
    inspirationDraftJsonSchema,
    inspirationDraftSchema,
  );
}

export function generateSongDescription(input: {
  title: string;
  artistName: string;
  theme?: string;
}): Promise<string> {
  return generateStructured(
    prompts.songDescriptionPrompt(input),
    textDraftJsonSchema,
    textDraftSchema,
  ).then((d) => d.text);
}

export function generateSocialPost(input: {
  platform: "facebook" | "whatsapp";
  contentTitle: string;
  contentTypeLabel: string;
  url?: string;
}): Promise<string> {
  return generateStructured(prompts.socialPostPrompt(input), textDraftJsonSchema, textDraftSchema).then(
    (d) => d.text,
  );
}
