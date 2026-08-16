import { z } from "zod";

export const verseSchema = z.object({
  reference: z.string().min(2, "Référence requise"),
  text: z.string().min(5, "Texte requis"),
  explanation: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  date: z.string().min(1, "Date requise"),
  published: z.boolean().optional(),
});

export type VerseInput = z.infer<typeof verseSchema>;
