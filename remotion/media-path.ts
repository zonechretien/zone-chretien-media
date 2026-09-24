/**
 * Un chemin de média est toujours relatif à la racine de la bibliothèque du
 * disque externe, avec des « / » (ex. « Musiques/adoration-douce.mp3 »).
 * Cette vérification est une première barrière côté templates ; le studio
 * local refait sa propre vérification (résolution + liens symboliques) avant
 * de servir le moindre fichier.
 */
export function isSafeRelativeMediaPath(p: string): boolean {
  if (!p || p.length > 260) return false;
  if (p.includes("\\") || p.includes("\0")) return false;
  if (p.startsWith("/")) return false;
  if (/^[a-zA-Z]:/.test(p)) return false; // lettre de lecteur Windows
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(p)) return false; // URL
  const segments = p.split("/");
  return segments.every((s) => s !== "" && s !== "." && s !== "..");
}

/** Construit l'URL d'un média servi par le studio local. */
export function mediaUrl(path: string, mediaBaseUrl: string | undefined): string | null {
  if (!mediaBaseUrl || !isSafeRelativeMediaPath(path)) return null;
  const base = mediaBaseUrl.endsWith("/") ? mediaBaseUrl : `${mediaBaseUrl}/`;
  return base + path.split("/").map(encodeURIComponent).join("/");
}
