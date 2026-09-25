/**
 * Description d'un Reel en « écrans », indépendante du format et du rendu.
 * Chaque template transforme ses props en ReelSpec ; le moteur (layout.ts +
 * ReelScreens.tsx) se charge des tailles, du découpage, du minutage et des
 * animations, identiques pour tous les templates.
 */

import type { BRAND } from "../brand";

export type ThemeId = keyof typeof BRAND.themes;

export type DetailIcon = "date" | "time" | "place";

export type ScreenBlock =
  /** Grand titre (accroche). */
  | { type: "heading"; text: string }
  /** Texte principal, apparition mot par mot, réparti sur plusieurs écrans si besoin. */
  | { type: "body"; text: string; quote?: boolean }
  /** Informations pratiques (date, heure, lieu), avec pictogrammes. */
  | { type: "details"; items: { icon: DetailIcon; text: string }[] }
  /** Appel à l'action final. */
  | { type: "cta"; text: string };

export type ScreenSpec = {
  blocks: ScreenBlock[];
  /** Ligne dorée sous le contenu (référence d'un verset…), affichée sur le dernier écran du groupe. */
  footer?: string;
};

export type ReelSpec = {
  /** Variation de la charte propre au template (couleur d'accent, fond par défaut). */
  theme: ThemeId;
  /** Petit libellé d'accroche en capitales, en haut, pendant toute la vidéo (facultatif). */
  kicker: string;
  /** Ligne dorée affichée en bas pendant toute la vidéo (référence, auteur…), facultative. */
  persistentFooter: string | null;
  screens: ScreenSpec[];
};
