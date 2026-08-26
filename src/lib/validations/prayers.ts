import { z } from "zod";

export const PRAYER_CATEGORIES = [
  "MORNING",
  "MIDDAY",
  "EVENING",
  "FAMILY",
  "HEALING",
  "PROTECTION",
] as const;

export const PRAYER_CATEGORY_LABELS: Record<(typeof PRAYER_CATEGORIES)[number], string> = {
  MORNING: "Prière du matin",
  MIDDAY: "Prière de midi",
  EVENING: "Prière du soir",
  FAMILY: "Prière familiale",
  HEALING: "Prière pour la guérison",
  PROTECTION: "Prière pour la protection",
};

export const prayerSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  content: z.string().min(10, "Contenu requis"),
  category: z.enum(PRAYER_CATEGORIES, { message: "Catégorie requise" }),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  publishedAt: z.string().optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export type PrayerInput = z.infer<typeof prayerSchema>;
