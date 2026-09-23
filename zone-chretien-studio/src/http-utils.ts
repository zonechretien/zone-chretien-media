/** Utilitaires HTTP purs (testés) : requêtes Range, origines, nommage des exports. */

export type ByteRange = { start: number; end: number };

/**
 * Analyse un en-tête Range (une seule plage, seule forme utilisée par les
 * lecteurs audio/vidéo). null = en-tête absent ou ignoré → réponse 200
 * complète ; "unsatisfiable" → 416.
 */
export function parseRange(header: string | undefined, size: number): ByteRange | null | "unsatisfiable" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  if (size === 0) return "unsatisfiable";

  let start: number;
  let end: number;
  if (m[1] === "") {
    // Suffixe : les N derniers octets.
    const suffix = Number(m[2]);
    if (suffix === 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
}

/** Origine autorisée : comparaison exacte (schéma, hôte et port). */
export function isOriginAllowed(origin: string | undefined, allowed: readonly string[]): boolean {
  if (!origin) return false;
  let normalized: string;
  try {
    normalized = new URL(origin).origin;
  } catch {
    return false;
  }
  return allowed.some((a) => {
    try {
      return new URL(a).origin === normalized;
    } catch {
      return false;
    }
  });
}

/** Origine d'une adresse locale (le moteur de rendu de Remotion tourne sur localhost). */
export function isLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
  } catch {
    return false;
  }
}

/**
 * Protection contre le « DNS rebinding » : un site malveillant ne peut
 * joindre le studio que sous son propre nom d'hôte, jamais 127.0.0.1.
 */
export function isAllowedHost(host: string | undefined, port: number): boolean {
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`;
}

/** Nom de fichier sûr et lisible, sans accents ni caractères interdits par Windows. */
export function slugifyFileName(text: string, fallback: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || fallback;
}

/** Horodatage local lisible pour un nom de fichier : 2026-09-23_14-05-09. */
export function fileTimestamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}
