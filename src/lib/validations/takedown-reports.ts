import { z } from "zod";

export const TAKEDOWN_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;

export const TAKEDOWN_STATUS_LABELS: Record<(typeof TAKEDOWN_STATUSES)[number], string> = {
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
};

/** Sous-ensemble de ContentType pour lequel une page de détail public existe et
 * peut donc faire l'objet d'un signalement (ARTIST exclu : pas de composant
 * audio/vidéo à signaler sur une fiche artiste). */
export const REPORTABLE_CONTENT_TYPES = [
  "SONG",
  "VIDEO",
  "INSPIRATION",
  "ARTICLE",
  "DEVOTION",
  "PRAYER",
  "VERSE",
  "TESTIMONY",
  "RESOURCE",
] as const;

export const takedownReportSchema = z.object({
  requesterName: z.string().min(2, "Nom requis (2 caractères min.)"),
  requesterEmail: z.string().email("Adresse email invalide"),
  message: z.string().min(10, "Merci de décrire le problème (10 caractères min.)"),
  contentType: z.enum(REPORTABLE_CONTENT_TYPES).optional().or(z.literal("")),
  contentId: z.string().optional().or(z.literal("")),
  contentTitle: z.string().optional().or(z.literal("")),
  contentUrl: z.string().optional().or(z.literal("")),
});

export type TakedownReportInput = z.infer<typeof takedownReportSchema>;

/** Route d'édition admin du contenu concerné par un signalement — pour l'accès
 * rapide "dépublier immédiatement si nécessaire" depuis un signalement. */
export const CONTENT_TYPE_ADMIN_ROUTE: Record<(typeof REPORTABLE_CONTENT_TYPES)[number], string> = {
  SONG: "/admin/chansons",
  VIDEO: "/admin/videos",
  INSPIRATION: "/admin/inspirations",
  ARTICLE: "/admin/articles",
  DEVOTION: "/admin/devotions",
  PRAYER: "/admin/prieres",
  VERSE: "/admin/versets",
  TESTIMONY: "/admin/temoignages",
  RESOURCE: "/admin/bibliotheque",
};
