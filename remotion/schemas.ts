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
  widget?: "textarea" | "color" | "media" | "voice" | "slider" | "hidden" | "format" | "date" | "time";
  /** Champ « référence biblique » : bouton d'insertion du texte LSG 1910 dans le champ indiqué. */
  bible?: { textField: string };
  /** Média : type attendu et dossiers du disque proposés. */
  mediaKind?: "image" | "video" | "audio";
  folders?: string[];
  /** Valeur de départ quand le champ apparaît (ex. ajout d'une musique). */
  defaultValue?: unknown;
  /** Pas d'un champ numérique (1 par défaut). */
  step?: number;
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

/** Musique de fond (dossier Musiques/ du disque). Rejouée en boucle si elle est plus courte que le Reel. */
export const musicSchema = z.object({
  path: mediaPathSchema.meta(field({ label: "Musique", widget: "media", mediaKind: "audio", folders: ["Musiques"] })),
  volume: z.number().min(0).max(1).meta(field({ label: "Volume", widget: "slider", defaultValue: 0.6 })),
  fadeInSeconds: z.number().min(0).max(5).meta(field({ label: "Fondu d'entrée (secondes)", step: 0.5, defaultValue: 1 })),
  fadeOutSeconds: z.number().min(0).max(5).meta(field({ label: "Fondu de sortie (secondes)", step: 0.5, defaultValue: 2 })),
});
export type MusicProps = z.infer<typeof musicSchema>;

/** Voix off enregistrée depuis l'éditeur (dossier VoixOff/ du disque). */
export const voiceOverSchema = z.object({
  path: mediaPathSchema.meta(field({ label: "Voix off", widget: "voice", mediaKind: "audio", folders: ["VoixOff"] })),
  volume: z.number().min(0).max(1).meta(field({ label: "Volume de la voix", widget: "slider", defaultValue: 1 })),
  startSeconds: z
    .number()
    .min(0)
    .max(10)
    .meta(field({ label: "Début de la voix (secondes)", step: 0.5, defaultValue: 0.5 })),
  /** Durée du fichier, fournie par le studio local (baisse de la musique, durée calée). */
  mediaDurationSeconds: z.number().positive().nullable().meta(field({ label: "Durée de la voix", widget: "hidden" })),
  musicDuckVolume: z
    .number()
    .min(0)
    .max(1)
    .meta(field({ label: "Musique pendant la voix", widget: "slider", defaultValue: 0.25, help: "La musique baisse automatiquement à ce niveau pendant la voix off." })),
  fitDuration: z.boolean().meta(field({ label: "Caler la durée de la vidéo sur la voix off", defaultValue: true })),
});
export type VoiceOverProps = z.infer<typeof voiceOverSchema>;

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
    .meta(field({ label: "Durée (secondes)", help: "Vide = durée calculée selon la longueur du texte (ou calée sur la voix off si demandé)." })),
  // Facultatifs, avec null par défaut : les projets enregistrés avant l'audio restent valides.
  music: musicSchema.nullable().default(null).meta(field({ label: "Musique" })),
  voiceOver: voiceOverSchema.nullable().default(null).meta(field({ label: "Voix off" })),
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

const kicker = (placeholder: string) =>
  z.string().max(40).meta(field({ label: "Accroche", placeholder: `Ex. ${placeholder}`, help: "Petit libellé en haut de la vidéo (facultatif)." }));
const title = (label: string) => z.string().trim().min(1, "Le titre est obligatoire").max(80).meta(field({ label }));
const showVersion = z.boolean().meta(field({ label: "Afficher « LSG 1910 » après la référence" }));
const callToAction = z
  .string()
  .max(60)
  .meta(field({ label: "Appel à l'action (écran final)", placeholder: "Ex. Rejoins-nous sur zone-chretien.org", help: "Facultatif." }));

export const priereSchema = baseTemplateSchema.extend({
  kicker: kicker("Prions ensemble"),
  title: title("Titre de la prière"),
  text: z
    .string()
    .trim()
    .min(1, "Le texte de la prière est obligatoire")
    .max(1500)
    .meta(field({ label: "Texte de la prière", widget: "textarea", help: "Un texte long est réparti automatiquement sur plusieurs écrans." })),
  verseReference: z
    .string()
    .trim()
    .max(60)
    .meta(field({ label: "Verset (facultatif) — référence", placeholder: "Ex. Philippiens 4:6-7", bible: { textField: "verseText" } })),
  verseText: z.string().trim().max(600).meta(field({ label: "Verset (facultatif) — texte", widget: "textarea" })),
  showVersion,
});
export type PriereProps = z.infer<typeof priereSchema>;

export const devotionSchema = baseTemplateSchema.extend({
  kicker: kicker("Dévotion du jour"),
  title: title("Titre de la dévotion"),
  verseReference: z
    .string()
    .trim()
    .min(1, "La référence est obligatoire")
    .max(60)
    .meta(field({ label: "Verset — référence", placeholder: "Ex. 2 Corinthiens 12:9", bible: { textField: "verseText" } })),
  verseText: z.string().trim().min(1, "Le texte du verset est obligatoire").max(600).meta(field({ label: "Verset — texte", widget: "textarea" })),
  reflection: z
    .string()
    .trim()
    .min(1, "La réflexion est obligatoire")
    .max(1200)
    .meta(field({ label: "Réflexion courte", widget: "textarea", help: "Quelques phrases : répartie automatiquement sur plusieurs écrans si besoin." })),
  callToAction,
  showVersion,
});
export type DevotionProps = z.infer<typeof devotionSchema>;

export const citationSchema = baseTemplateSchema.extend({
  kicker: kicker("Citation"),
  quote: z.string().trim().min(1, "La citation est obligatoire").max(800).meta(field({ label: "Citation", widget: "textarea" })),
  author: z.string().trim().min(1, "L'auteur est obligatoire").max(60).meta(field({ label: "Auteur", placeholder: "Ex. Charles Spurgeon" })),
});
export type CitationProps = z.infer<typeof citationSchema>;

export const evenementSchema = baseTemplateSchema.extend({
  kicker: kicker("Événement"),
  name: title("Nom de l'événement"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue")
    .meta(field({ label: "Date", widget: "date" })),
  time: z
    .string()
    .regex(/^(\d{2}:\d{2})?$/, "Heure au format HH:MM")
    .meta(field({ label: "Heure (facultatif)", widget: "time" })),
  place: z.string().trim().max(80).meta(field({ label: "Lieu (facultatif)", placeholder: "Ex. Église de la Grâce, Lyon" })),
  description: z.string().trim().max(400).meta(field({ label: "Description (facultatif)", widget: "textarea" })),
  callToAction,
});
export type EvenementProps = z.infer<typeof evenementSchema>;

/** Props injectées à l'exécution, jamais enregistrées dans le projet. */
export type RuntimeProps = {
  /** URL de base du studio local servant les médias (ex. http://127.0.0.1:4317/media/). */
  mediaBaseUrl?: string;
  /** Superpose les zones sûres (aperçu uniquement, forcé à false à l'export). */
  showSafeZones?: boolean;
};
