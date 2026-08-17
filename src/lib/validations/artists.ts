import { z } from "zod";

const optionalUrl = z.string().url("URL invalide").optional().or(z.literal(""));

export const artistSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  role: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  photoUrl: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  twitterUrl: optionalUrl,
  isSponsored: z.boolean().optional(),
});

export type ArtistInput = z.infer<typeof artistSchema>;
