/**
 * Formats de sortie et zones sûres.
 *
 * Les zones sûres sont les marges où l'interface des applications (Reels,
 * TikTok, Shorts : légende, boutons J'aime/Commenter/Partager, nom du compte)
 * recouvre la vidéo. Aucun texte important ne doit y être placé. Les valeurs
 * 9:16 prennent la plus contraignante des trois applications.
 */

export const FORMAT_IDS = ["9:16", "1:1", "16:9"] as const;
export type FormatId = (typeof FORMAT_IDS)[number];

export type SafeZone = { top: number; right: number; bottom: number; left: number };

export type FormatSpec = {
  id: FormatId;
  label: string;
  width: number;
  height: number;
  safe: SafeZone;
};

export const FORMATS: Record<FormatId, FormatSpec> = {
  "9:16": {
    id: "9:16",
    label: "Vertical 9:16 — Reels, TikTok, Shorts",
    width: 1080,
    height: 1920,
    // Haut : nom du compte / onglets. Bas : légende + musique. Droite : colonne
    // de boutons. La gauche est gardée symétrique à la droite pour un texte centré.
    safe: { top: 270, right: 150, bottom: 480, left: 150 },
  },
  "1:1": {
    id: "1:1",
    label: "Carré 1:1 — fil Instagram / Facebook",
    width: 1080,
    height: 1080,
    safe: { top: 90, right: 90, bottom: 90, left: 90 },
  },
  "16:9": {
    id: "16:9",
    label: "Horizontal 16:9 — YouTube",
    width: 1920,
    height: 1080,
    safe: { top: 90, right: 160, bottom: 110, left: 160 },
  },
};

/** Zone utile (hors zones sûres) pour un format donné. */
export function contentBox(format: FormatId) {
  const f = FORMATS[format];
  return {
    x: f.safe.left,
    y: f.safe.top,
    width: f.width - f.safe.left - f.safe.right,
    height: f.height - f.safe.top - f.safe.bottom,
  };
}
