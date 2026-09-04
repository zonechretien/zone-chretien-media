import { z } from "zod";

const optionalUrl = z.string().url("URL invalide").optional().or(z.literal(""));
const optionalEmail = z.string().email("Email invalide").optional().or(z.literal(""));
// Format international basique : + optionnel suivi de 6 à 15 chiffres (espaces/tirets tolérés).
const optionalWhatsapp = z
  .string()
  .regex(/^\+?[\d\s-]{6,20}$/, "Numéro invalide (format international, ex : +509XXXXXXXX)")
  .optional()
  .or(z.literal(""));

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
  whatsappNumber: optionalWhatsapp,
  email: optionalEmail,
  isSponsored: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});

export type ArtistInput = z.infer<typeof artistSchema>;
