import { z } from "zod";

const passageSchema = z
  .object({
    bookSlug: z.string().min(1, "Livre requis"),
    bookName: z.string().min(1),
    chapterStart: z.number().int().min(1, "Chapitre de début invalide"),
    chapterEnd: z.number().int().min(1, "Chapitre de fin invalide"),
  })
  .refine((p) => p.chapterEnd >= p.chapterStart, {
    message: "Le chapitre de fin doit être supérieur ou égal au chapitre de début",
    path: ["chapterEnd"],
  });

const daySchema = z.object({
  dayNumber: z.number().int().min(1, "Numéro de jour invalide"),
  passages: z.array(passageSchema).min(1, "Au moins un passage requis par jour"),
});

export const readingPlanSchema = z
  .object({
    title: z.string().min(2, "Titre requis (2 caractères min.)"),
    slug: z.string().min(2, "Slug requis"),
    description: z.string().optional().or(z.literal("")),
    durationDays: z.number().int().min(1, "Durée requise (au moins 1 jour)"),
    coverImageUrl: z.string().url("URL d'image invalide").optional().or(z.literal("")),
    metaTitle: z.string().optional().or(z.literal("")),
    metaDescription: z.string().optional().or(z.literal("")),
    published: z.boolean().optional(),
    days: z.array(daySchema).min(1, "Au moins un jour requis"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<number>();
    data.days.forEach((day, index) => {
      if (seen.has(day.dayNumber)) {
        ctx.addIssue({
          code: "custom",
          message: `Le jour ${day.dayNumber} est utilisé plusieurs fois.`,
          path: ["days", index, "dayNumber"],
        });
      }
      seen.add(day.dayNumber);
    });
  });

export type ReadingPlanInput = z.infer<typeof readingPlanSchema>;
