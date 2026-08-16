import { z } from "zod";

export const devotionSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  mainVerseRef: z.string().min(2, "Référence requise"),
  mainVerseText: z.string().min(5, "Texte du verset requis"),
  reflection: z.string().min(10, "Réflexion requise"),
  application: z.string().min(5, "Application pratique requise"),
  prayer: z.string().min(5, "Prière requise"),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  date: z.string().min(1, "Date requise"),
  published: z.boolean().optional(),
});

export type DevotionInput = z.infer<typeof devotionSchema>;
