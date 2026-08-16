import { z } from "zod";

// Chaque schéma existe en deux versions : le JSON Schema envoyé au moteur IA
// (pour forcer la structure de sortie) et le schéma Zod utilisé pour valider
// la réponse avant de l'utiliser dans l'application.

export const devotionDraftJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    mainVerseRef: { type: "string" },
    mainVerseText: { type: "string" },
    reflection: { type: "string" },
    application: { type: "string" },
    prayer: { type: "string" },
  },
  required: ["title", "mainVerseRef", "mainVerseText", "reflection", "application", "prayer"],
};

export const devotionDraftSchema = z.object({
  title: z.string(),
  mainVerseRef: z.string(),
  mainVerseText: z.string(),
  reflection: z.string(),
  application: z.string(),
  prayer: z.string(),
});
export type DevotionDraft = z.infer<typeof devotionDraftSchema>;

export const prayerDraftJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    content: { type: "string" },
  },
  required: ["title", "content"],
};

export const prayerDraftSchema = z.object({
  title: z.string(),
  content: z.string(),
});
export type PrayerDraft = z.infer<typeof prayerDraftSchema>;

export const verseDraftJsonSchema = {
  type: "object",
  properties: {
    reference: { type: "string" },
    text: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["reference", "text", "explanation"],
};

export const verseDraftSchema = z.object({
  reference: z.string(),
  text: z.string(),
  explanation: z.string(),
});
export type VerseDraft = z.infer<typeof verseDraftSchema>;

export const inspirationDraftJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    content: { type: "string" },
  },
  required: ["title", "content"],
};

export const inspirationDraftSchema = z.object({
  title: z.string(),
  content: z.string(),
});
export type InspirationDraft = z.infer<typeof inspirationDraftSchema>;

export const textDraftJsonSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
  },
  required: ["text"],
};

export const textDraftSchema = z.object({ text: z.string() });
export type TextDraft = z.infer<typeof textDraftSchema>;
