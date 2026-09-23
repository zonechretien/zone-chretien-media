import { z } from "zod";
import { FORMAT_IDS } from "./formats";
import { isSafeRelativeMediaPath } from "./media-path";

/**
 * Schémas zod des props des templates. Ce sont eux qui sont enregistrés (en
 * JSON) dans ReelProject.data, qui génèrent le formulaire de l'éditeur et qui
 * sont revalidés par le studio local avant chaque export.
 */

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur attendue au format #RRGGBB");

/** Chemin d'un média relatif à la racine de la bibliothèque du disque externe
 * (ex. « Fonds/lever-de-soleil.jpg »). Jamais de chemin absolu ni de « .. ». */
export const mediaPathSchema = z
  .string()
  .min(1)
  .max(260)
  .refine(isSafeRelativeMediaPath, "Chemin de média invalide (chemin relatif à la bibliothèque attendu)");

export const backgroundSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("gradient"),
    from: hexColor,
    to: hexColor,
  }),
  z.object({
    type: z.literal("color"),
    color: hexColor,
  }),
  z.object({
    type: z.literal("image"),
    path: mediaPathSchema,
    /** Assombrissement pour garantir la lisibilité du texte (0 = aucun). */
    dim: z.number().min(0).max(0.9),
  }),
  z.object({
    type: z.literal("video"),
    path: mediaPathSchema,
    dim: z.number().min(0).max(0.9),
  }),
]);
export type BackgroundProps = z.infer<typeof backgroundSchema>;

/** Champs communs à tous les templates. */
export const baseTemplateSchema = z.object({
  format: z.enum(FORMAT_IDS),
  background: backgroundSchema,
  /** Durée imposée en secondes ; null = calculée automatiquement selon le texte. */
  durationSeconds: z.number().min(6).max(90).nullable(),
});

export const versetSchema = baseTemplateSchema.extend({
  /** Petit libellé d'accroche au-dessus du verset. */
  kicker: z.string().max(40),
  reference: z.string().trim().min(1, "La référence est obligatoire").max(60),
  text: z.string().trim().min(1, "Le texte du verset est obligatoire").max(1500),
  /** Affiche « LSG 1910 » à côté de la référence. */
  showVersion: z.boolean(),
});
export type VersetProps = z.infer<typeof versetSchema>;

/** Props injectées à l'exécution, jamais enregistrées dans le projet. */
export type RuntimeProps = {
  /** URL de base du studio local servant les médias (ex. http://127.0.0.1:4317/media/). */
  mediaBaseUrl?: string;
  /** Superpose les zones sûres (aperçu uniquement, forcé à false à l'export). */
  showSafeZones?: boolean;
};
