import { getRemotionEnvironment, staticFile } from "remotion";

export { isSafeRelativeMediaPath, mediaUrl } from "./media-path";

/**
 * URL d'un fichier de marque (polices, logo) rangé dans public/reels/.
 * - Dans l'aperçu du CMS (@remotion/player), Next.js le sert à /reels/…
 * - Au rendu, le studio local passe public/reels/ comme dossier public de
 *   Remotion : staticFile() pointe alors directement dessus.
 */
export function brandAsset(file: string): string {
  if (getRemotionEnvironment().isPlayer) return `/reels/${file}`;
  return staticFile(file);
}
