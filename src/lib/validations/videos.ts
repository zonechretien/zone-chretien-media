import { z } from "zod";

const optionalUrl = z.string().url("URL invalide").optional().or(z.literal(""));

export const videoSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional().or(z.literal("")),
  youtubeUrl: z.string().url("URL YouTube requise et valide"),
  thumbnailUrl: optionalUrl,
  categoryId: z.string().optional().or(z.literal("")),
  artistId: z.string().optional().or(z.literal("")),
  publishedAt: z.string().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

export type VideoInput = z.infer<typeof videoSchema>;
