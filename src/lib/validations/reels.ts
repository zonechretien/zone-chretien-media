import { z } from "zod";
import { FORMAT_IDS } from "@reels/formats";
import { REEL_LANGUAGES } from "@reels/schemas";
import { isSafeRelativeMediaPath } from "@reels/media-path";

export const REEL_STATUS_LABELS = {
  DRAFT: "Brouillon",
  READY: "Prêt",
  EXPORTED: "Exporté",
} as const;

export const newReelSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(120, "120 caractères maximum."),
  templateId: z.string().min(1, "Choisissez un template."),
  format: z.enum(FORMAT_IDS, "Choisissez un format."),
  language: z.enum(REEL_LANGUAGES).default("fr"),
});
export type NewReelInput = z.infer<typeof newReelSchema>;

export const saveReelSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(120, "120 caractères maximum."),
  /** Statut choisi à la main ; « Exporté » n'est posé qu'après un export réussi. */
  status: z.enum(["DRAFT", "READY"]).optional(),
  /** Props du template, validées ensuite par le schéma du template. */
  data: z.record(z.string(), z.unknown()),
});
export type SaveReelInput = z.infer<typeof saveReelSchema>;

/** Chemin relatif d'un export renvoyé par le studio local : toujours dans Exports/, en .mp4. */
export const exportPathSchema = z
  .string()
  .refine((p) => isSafeRelativeMediaPath(p) && p.startsWith("Exports/") && p.toLowerCase().endsWith(".mp4"), "Chemin d'export invalide.");
