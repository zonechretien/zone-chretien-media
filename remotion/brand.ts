/**
 * Charte des Reels Zone-Chrétien.
 *
 * Alignée sur la charte du site public (tokens --brand-* de src/app/globals.css :
 * bleu nuit #0A1628, or #E8A020, Playfair Display / DM Sans / Bebas Neue) et sur
 * le logo officiel (monogramme « ZC » : Z argent, C or ; devise « Inspiré par la
 * foi, animé par la Parole »).
 *
 * Tout ce qui touche à la marque passe par ce fichier : aucune couleur ni police
 * ne doit être écrite en dur dans les compositions. Les contrastes des couples
 * texte / fond sont vérifiés par brand.test.ts (seuils WCAG pour une lecture sur
 * téléphone).
 */

export const BRAND = {
  /** Nom affiché dans l'en-tête et sur l'écran de fin. */
  name: "Zone-Chrétien",
  /** Devise du logo officiel, affichée sur l'écran de fin. */
  tagline: "Inspiré par la foi, animé par la Parole",
  /** Adresse affichée à la fin de chaque vidéo. */
  website: "zone-chretien.org",

  colors: {
    // --- Principales : fonds (du plus sombre au plus clair) -----------------
    /** Bleu nuit profond (--brand-navy) : fond de base, bas des dégradés, texte sur or. */
    navyDeep: "#0A1628",
    /** Bleu nuit (--brand-navy-light) : couleur unie par défaut. */
    navy: "#132238",
    /** Bleu nuit clair (--brand-navy-mid) : haut des dégradés. Fond le plus clair de la charte. */
    navyLight: "#1A3055",

    // --- Principales : accent ------------------------------------------------
    /** Or (--brand-gold) : accroche, référence, filets, pictogrammes, bouton d'appel. */
    gold: "#E8A020",
    /** Or clair (--brand-gold-light) : accent de la prière, reflets. */
    goldLight: "#F5C842",

    // --- Secondaires (décor uniquement, jamais pour du texte) ---------------
    /** Bleu (--brand-blue-bright) : contraste insuffisant pour du texte sur bleu nuit. */
    blue: "#2D7DD2",
    /** Argent du « Z » du logo. */
    silver: "#D5DAE1",
    silverDark: "#8C95A3",

    // --- Texte -----------------------------------------------------------------
    /** Texte principal (--brand-off-white) : blanc cassé, plus doux qu'un blanc pur. */
    text: "#F5F7FA",
    /** Texte secondaire (nom de la marque dans l'en-tête). Couleur opaque : contraste vérifiable. */
    textMuted: "#C3CCDA",
    /** Texte posé sur l'or (bouton d'appel à l'action). */
    onGold: "#0A1628",
  },

  /** Lisibilité sur les fonds photo et vidéo du disque (voir Background.tsx). */
  readability: {
    /**
     * Voile bleu nuit minimal, quelle que soit la valeur du curseur
     * « Assombrissement » : garantit un contraste d'au moins 4,5:1 au texte
     * principal même sur une photo presque blanche.
     */
    minPhotoDim: 0.65,
    /** Ombre portée du texte sur les fonds photo et vidéo (détache le texte d'un fond chargé). */
    photoTextShadow: "0 0.04em 0.25em rgba(10, 22, 40, 0.85)",
  },

  fonts: {
    /** Titres et textes bibliques (--font-display du site). */
    serif: "ZC Playfair Display",
    /** Libellés, références, textes courants (--font-body du site). */
    sans: "ZC DM Sans",
    /** Logotype « ZONE-CHRÉTIEN » (--font-accent du site, comme dans l'en-tête du site). */
    display: "ZC Bebas Neue",
  },

  /**
   * Fichiers de polices locaux, servis depuis public/reels/fonts/ avec leur
   * licence (SIL Open Font License 1.1 : intégration dans des vidéos autorisée,
   * y compris commerciale). Jamais chargés depuis Google Fonts : le rendu doit
   * fonctionner hors ligne.
   */
  fontFiles: [
    { family: "ZC Playfair Display", file: "fonts/PlayfairDisplay.ttf", style: "normal", weight: "400 900", license: "OFL-PlayfairDisplay.txt" },
    { family: "ZC Playfair Display", file: "fonts/PlayfairDisplay-Italic.ttf", style: "italic", weight: "400 900", license: "OFL-PlayfairDisplay.txt" },
    { family: "ZC DM Sans", file: "fonts/DMSans.ttf", style: "normal", weight: "100 1000", license: "OFL-DMSans.txt" },
    { family: "ZC Bebas Neue", file: "fonts/BebasNeue.ttf", style: "normal", weight: "400", license: "OFL-BebasNeue.txt" },
  ],

  /**
   * Logo : monogramme en SVG plat d'après le logo officiel
   * (design/logo/source/monogramme.png) : Z et C géométriques ajustés
   * sur l'original, silhouette décalquée. Tailles en part du plus petit côté
   * de la vidéo (1080 px dans les 3 formats).
   */
  logo: {
    /** Monogramme (Z argent, C or, silhouette au micro, liseré fin), sans fond : en-tête et écran de fin. */
    monogram: "logo/monogramme.svg",
    /** Proportions du monogramme (largeur / hauteur de son viewBox), pour réserver sa place avant chargement. */
    monogramRatio: 546 / 283,
    /** Hauteur du monogramme de l'en-tête, en haut du bloc de contenu. */
    headerSize: 0.062,
    /** Logotype « ZONE-CHRÉTIEN » à côté du monogramme, en part de la hauteur du monogramme. */
    headerWordmark: 0.62,
    /** Hauteur du monogramme de l'écran de fin. */
    endCardSize: 0.24,
  },

  /**
   * Variation par template, dans la charte bleu nuit et or, pour reconnaître
   * d'un coup d'œil un verset, une prière ou un événement dans un fil :
   * - `from` : haut du dégradé par défaut des nouveaux projets (bas : navyDeep) ;
   * - `accent` : accroche, filet, référence / auteur, pictogrammes.
   * Le bouton d'appel reste toujours or. Contrastes vérifiés par brand.test.ts.
   */
  themes: {
    /** Bleu nuit classique, or. */
    Verset: { label: "Bleu nuit, or", from: "#1A3055", accent: "#E8A020" },
    /** Indigo nuit, or clair : ambiance plus douce. */
    Priere: { label: "Indigo nuit, or clair", from: "#2B2F63", accent: "#F5C842" },
    /** Bleu pétrole nuit, or. */
    Devotion: { label: "Bleu pétrole, or", from: "#123D52", accent: "#E8A020" },
    /** Ardoise, argent (comme le Z du logo). */
    Citation: { label: "Ardoise, argent", from: "#1C2B45", accent: "#D5DAE1" },
    /** Bleu roi nuit (bleu du site), or : le plus vif, pour les annonces. */
    Evenement: { label: "Bleu roi, or", from: "#163C70", accent: "#E8A020" },
  },

  fps: 30,
  /** Durée de l'écran de fin (logo + site), en secondes. */
  endCardSeconds: 2.5,
} as const;

/** « ZONE-CHRÉTIEN », toujours avec l'accent (majuscules françaises accentuées). */
export function wordmarkText(): string {
  return BRAND.name.toLocaleUpperCase("fr-FR");
}

/** Couleur #RRGGBB → rgba() avec l'opacité donnée (voiles, ombres). */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
