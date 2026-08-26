import { z } from "zod";

export const playlistSchema = z.object({
  title: z.string().min(2, "Titre requis (2 caractères min.)"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL d'image invalide").optional().or(z.literal("")),
  order: z.number().int().optional(),
  metaTitle: z.string().optional().or(z.literal("")),
  metaDescription: z.string().optional().or(z.literal("")),
  publishedAt: z.string().optional().or(z.literal("")),
  published: z.boolean().optional(),
  songIds: z.array(z.string()).optional(),
});

export type PlaylistInput = z.infer<typeof playlistSchema>;
