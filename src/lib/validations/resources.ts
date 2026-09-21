import { z } from "zod";

export const RESOURCE_TYPES = [
  "BOOK",
  "BIBLE_STUDY",
  "AUDIO_SERMON",
  "VIDEO_SERMON",
  "CONFERENCE",
  "COURSE",
] as const;

export const RESOURCE_TYPE_LABELS: Record<(typeof RESOURCE_TYPES)[number], string> = {
  BOOK: "Livre",
  BIBLE_STUDY: "Étude biblique",
  AUDIO_SERMON: "Prédication audio",
  VIDEO_SERMON: "Prédication vidéo",
  CONFERENCE: "Conférence",
  COURSE: "Cours",
};

/** Libellé + placeholder du champ "fichier" affiché dans le CMS, adaptés au type
 * choisi. CONFERENCE/COURSE acceptent indifféremment un PDF ou un lien YouTube —
 * la page publique détecte lequel des deux au moment de l'affichage. */
export const RESOURCE_FILE_FIELD_CONFIG: Record<
  (typeof RESOURCE_TYPES)[number],
  { label: string; placeholder: string; isYoutube: boolean }
> = {
  BOOK: { label: "URL du PDF", placeholder: "https://…", isYoutube: false },
  BIBLE_STUDY: { label: "URL du PDF", placeholder: "https://…", isYoutube: false },
  AUDIO_SERMON: { label: "URL audio", placeholder: "https://…", isYoutube: false },
  VIDEO_SERMON: { label: "URL YouTube", placeholder: "https://youtube.com/…", isYoutube: true },
  CONFERENCE: { label: "URL du fichier (PDF ou YouTube)", placeholder: "https://…", isYoutube: false },
  COURSE: { label: "URL du fichier (PDF ou YouTube)", placeholder: "https://…", isYoutube: false },
};

export const resourceSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional().or(z.literal("")),
  author: z.string().optional().or(z.literal("")),
  type: z.enum(RESOURCE_TYPES, { message: "Type requis" }),
  fileUrl: z.string().url("URL invalide"),
  coverImageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  // Champs "Détails du livre" (type BOOK) : gardés en string comme les autres
  // champs de formulaire optionnels ci-dessus (ex. publishedAt) — la coercion
  // en nombre se fait dans src/lib/actions/resources.ts (toData), pas ici,
  // pour éviter que z.preprocess() casse l'inférence de type attendue par
  // @hookform/resolvers/zod (erreur de build sinon).
  pageCount: z.string().optional().or(z.literal("")),
  language: z.string().optional().or(z.literal("")),
  publicationYear: z.string().optional().or(z.literal("")),
  fileSizeLabel: z.string().optional().or(z.literal("")),
  freePreviewPages: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
  publishedAt: z.string().optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export type ResourceInput = z.infer<typeof resourceSchema>;
