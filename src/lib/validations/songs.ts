import { z } from "zod";

const optionalUrl = z.string().url("URL invalide").optional().or(z.literal(""));

export const songSchema = z.object({
  title: z.string().min(2, "Titre requis (2 caractères min.)"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional().or(z.literal("")),
  lyrics: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL d'image requise et valide"),
  audioUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  artistId: z.string().min(1, "Artiste requis"),
  categoryId: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
  metaTitle: z.string().optional().or(z.literal("")),
  metaDescription: z.string().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

export type SongInput = z.infer<typeof songSchema>;
