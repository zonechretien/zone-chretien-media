import { z } from "zod";
import { FORMAT_IDS } from "./formats";
import { isSafeRelativeMediaPath } from "./media-path";

/**
 * Schémas zod des props des templates. Ce sont eux qui sont enregistrés (en
 * JSON) dans ReelProject.data, qui génèrent le formulaire de l'éditeur et qui
 * sont revalidés par le studio local avant chaque export.
 */

/**
 * Métadonnées d'affichage d'un champ (via .meta() de zod 4) : c'est ce qui
 * permet à l'éditeur du CMS de générer le formulaire directement depuis le
 * schéma, sans le réécrire à la main pour chaque template.
 */
export type FieldMeta = {
  label: string;
  help?: string;
  placeholder?: string;
  /** Rendu particulier ; par défaut, déduit du type zod. */
  widget?: "textarea" | "color" | "media" | "slider" | "hidden" | "format";
  /** Champ « référence biblique » : bouton d'insertion du texte LSG 1910 dans le champ indiqué. */
  bible?: { textField: string };
};
const field = (meta: FieldMeta) => meta;

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur attendue au format #RRGGBB");

/** Chemin d'un média relatif à la racine de la bibliothèque du disque externe
 * (ex. « Fonds/lever-de-soleil.jpg »). Jamais de chemin absolu ni de « .. ». */
export const mediaPathSchema = z
  .string()
  .min(1, "Choisissez un média sur le disque.")
  .max(260)
  .refine(isSafeRelativeMediaPath, "Chemin de média invalide (chemin relatif à la bibliothèque attendu)");

export const backgroundSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("gradient"),
      from: hexColor.meta(field({ label: "Couleur du haut", widget: "color" })),
      to: hexColor.meta(field({ label: "Couleur du bas", widget: "color" })),
    })
    .meta(field({ label: "Dégradé" })),
  z
    .object({
      type: z.literal("color"),
      color: hexColor.meta(field({ label: "Couleur", widget: "color" })),
    })
    .meta(field({ label: "Couleur unie" })),
  z
    .object({
      type: z.literal("image"),
      path: mediaPathSchema.meta(field({ label: "Image", widget: "media" })),
      /** Assombrissement pour garantir la lisibilité du texte (0 = aucun). */
      dim: z.number().min(0).max(0.9).meta(field({ label: "Assombrissement", help: "Garantit la lisibilité du texte.", widget: "slider" })),
    })
    .meta(field({ label: "Image du disque" })),
  z
    .object({
      type: z.literal("video"),
      path: mediaPathSchema.meta(field({ label: "Vidéo", widget: "media" })),
      dim: z.number().min(0).max(0.9).meta(field({ label: "Assombrissement", help: "Garantit la lisibilité du texte.", widget: "slider" })),
      /** Durée de la vidéo (fournie par le studio local) : la vidéo boucle si elle est plus courte que le Reel. */
      mediaDurationSeconds: z.number().positive().nullable().meta(field({ label: "Durée de la vidéo", widget: "hidden" })),
    })
    .meta(field({ label: "Vidéo du disque" })),
]);
export type BackgroundProps = z.infer<typeof backgroundSchema>;

/** Champs communs à tous les templates. */
export const baseTemplateSchema = z.object({
  format: z.enum(FORMAT_IDS).meta(field({ label: "Format", widget: "format" })),
  background: backgroundSchema.meta(field({ label: "Fond" })),
  /** Durée imposée en secondes ; null = calculée automatiquement selon le texte. */
  durationSeconds: z
    .number()
    .min(6)
    .max(90)
    .nullable()
    .meta(field({ label: "Durée (secondes)", help: "Vide = durée calculée selon la longueur du texte." })),
});

export const versetSchema = baseTemplateSchema.extend({
  /** Petit libellé d'accroche au-dessus du verset. */
  kicker: z.string().max(40).meta(field({ label: "Accroche", placeholder: "Ex. Parole du jour", help: "Petit libellé au-dessus du verset (facultatif)." })),
  reference: z
    .string()
    .trim()
    .min(1, "La référence est obligatoire")
    .max(60)
    .meta(field({ label: "Référence", placeholder: "Ex. Psaume 34:8, Jn 3:16-17, 1 Co 13:4", bible: { textField: "text" } })),
  text: z
    .string()
    .trim()
    .min(1, "Le texte du verset est obligatoire")
    .max(1500)
    .meta(field({ label: "Texte du verset", widget: "textarea", help: "Louis Segond 1910. Un texte long est réparti automatiquement sur plusieurs écrans." })),
  /** Affiche « LSG 1910 » à côté de la référence. */
  showVersion: z.boolean().meta(field({ label: "Afficher « LSG 1910 » après la référence" })),
});
export type VersetProps = z.infer<typeof versetSchema>;

/** Props injectées à l'exécution, jamais enregistrées dans le projet. */
export type RuntimeProps = {
  /** URL de base du studio local servant les médias (ex. http://127.0.0.1:4317/media/). */
  mediaBaseUrl?: string;
  /** Superpose les zones sûres (aperçu uniquement, forcé à false à l'export). */
  showSafeZones?: boolean;
};
