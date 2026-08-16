import { z } from "zod";

export const testimonySchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  content: z.string().min(10, "Contenu requis"),
  authorName: z.string().min(2, "Nom de l'auteur requis"),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export type TestimonyInput = z.infer<typeof testimonySchema>;
