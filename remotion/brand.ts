/**
 * Identité visuelle des Reels Zone-Chrétien.
 *
 * ⚠️ VALEURS PROVISOIRES — à remplacer par la charte officielle Zone-Chrétien.
 * Elles reprennent pour l'instant ce que le site utilise déjà : les couleurs par
 * défaut de `Settings` (primaryColor / accentColor) et les polices du site
 * (Playfair Display pour les titres, DM Sans pour le texte courant).
 *
 * Tout ce qui touche à la marque passe par ce fichier : aucune couleur ni police
 * ne doit être écrite en dur dans les compositions.
 */

export const BRAND = {
  /** PROVISOIRE — nom affiché sur l'écran de fin. */
  name: "Zone-Chrétien",
  /** Adresse affichée à la fin de chaque vidéo. */
  website: "zone-chretien.org",

  colors: {
    /** PROVISOIRE — bleu nuit (Settings.primaryColor). */
    navy: "#0B1E3D",
    navyDeep: "#050E1F",
    navyLight: "#16335F",
    /** PROVISOIRE — or (Settings.accentColor). */
    gold: "#D4AF37",
    goldSoft: "#E9D48C",
    /** Blanc cassé : plus doux qu'un blanc pur sur fond sombre. */
    text: "#F8F5EE",
    textMuted: "rgba(248, 245, 238, 0.72)",
  },

  fonts: {
    /** PROVISOIRE — titres et textes bibliques. */
    serif: "ZC Playfair Display",
    /** PROVISOIRE — libellés, références, textes courants. */
    sans: "ZC DM Sans",
  },

  /** Fichiers de polices locaux (licence OFL), servis depuis public/reels/fonts/.
   * Jamais chargés depuis Google Fonts : le rendu doit fonctionner hors ligne. */
  fontFiles: [
    { family: "ZC Playfair Display", file: "fonts/PlayfairDisplay.ttf", style: "normal", weight: "400 900" },
    { family: "ZC Playfair Display", file: "fonts/PlayfairDisplay-Italic.ttf", style: "italic", weight: "400 900" },
    { family: "ZC DM Sans", file: "fonts/DMSans.ttf", style: "normal", weight: "100 1000" },
  ],

  fps: 30,
  /** Durée de l'écran de fin (logo + site), en secondes. */
  endCardSeconds: 2.5,
} as const;
