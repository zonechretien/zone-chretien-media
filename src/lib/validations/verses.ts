import { z } from "zod";

export const MEDITATION_SOURCES = ["MANUEL", "IA_GENERE", "IA_MODIFIE"] as const;

export const verseSchema = z.object({
  reference: z.string().min(2, "Référence requise"),
  text: z.string().min(5, "Texte requis"),
  explanation: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  date: z.string().min(1, "Date requise"),
  published: z.boolean().optional(),
  meditationReflection: z.string().optional().or(z.literal("")),
  meditationApplication: z.string().optional().or(z.literal("")),
  meditationPrayer: z.string().optional().or(z.literal("")),
  meditationSource: z.enum(MEDITATION_SOURCES).optional().nullable(),
});

export type VerseInput = z.infer<typeof verseSchema>;
