import { z } from "zod";
import type { ContentType } from "@prisma/client";

export const CATEGORY_TYPES = ["SONG", "ARTICLE", "VIDEO", "INSPIRATION"] as const;

// Category.type est typé ContentType côté Prisma (9 valeurs, réutilisé aussi par
// ViewLog), mais seuls ces 4 types sont proposés à la création d'une catégorie.
export const CATEGORY_TYPE_LABELS: Partial<Record<ContentType, string>> = {
  SONG: "Chansons",
  ARTICLE: "Articles",
  VIDEO: "Vidéos",
  INSPIRATION: "Inspirations",
};

export const categorySchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  type: z.enum(CATEGORY_TYPES, { message: "Type requis" }),
  description: z.string().optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
});

export type TagInput = z.infer<typeof tagSchema>;
