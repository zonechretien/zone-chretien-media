import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  excerpt: z.string().optional().or(z.literal("")),
  content: z.string().min(20, "Contenu requis (20 caractères min.)"),
  coverImageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
  metaTitle: z.string().optional().or(z.literal("")),
  metaDescription: z.string().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;
