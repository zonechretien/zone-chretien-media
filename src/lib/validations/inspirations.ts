import { z } from "zod";

export const inspirationSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  content: z.string().min(10, "Contenu requis (10 caractères min.)"),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  author: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export type InspirationInput = z.infer<typeof inspirationSchema>;
