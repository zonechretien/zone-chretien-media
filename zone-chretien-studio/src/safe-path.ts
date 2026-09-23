import fs from "node:fs";
import path from "node:path";

/**
 * Résolution sécurisée d'un chemin relatif de la bibliothèque.
 *
 * Trois barrières successives :
 * 1. forme du chemin (relatif, « / », pas de « .. », pas de lettre de lecteur,
 *    pas d'URL, pas de dossier caché comme le cache des miniatures) ;
 * 2. le chemin résolu doit rester sous la racine ;
 * 3. après résolution des liens symboliques / jonctions (realpath), le fichier
 *    réel doit toujours être sous la racine réelle.
 */

export class UnsafePathError extends Error {}

export function isSafeRelativePath(rel: string): boolean {
  if (!rel || rel.length > 260) return false;
  if (rel.includes("\\") || rel.includes("\0")) return false;
  if (rel.startsWith("/") || /^[a-zA-Z]:/.test(rel)) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rel)) return false;
  return rel.split("/").every((s) => s !== "" && s !== "." && s !== ".." && !s.startsWith("."));
}

/** Vrai si `child` est `parent` ou se trouve dessous (insensible à la casse sous Windows). */
export function isInside(parent: string, child: string): boolean {
  const norm = (p: string) => (process.platform === "win32" ? p.toLowerCase() : p);
  const rel = path.relative(norm(parent), norm(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Chemin absolu d'un fichier existant de la bibliothèque, ou erreur. */
export function resolveLibraryFile(root: string, rel: string): string {
  if (!isSafeRelativePath(rel)) throw new UnsafePathError("Chemin de média invalide.");
  const absolute = path.resolve(root, ...rel.split("/"));
  if (!isInside(root, absolute)) throw new UnsafePathError("Chemin de média invalide.");

  let real: string;
  try {
    real = fs.realpathSync.native(absolute);
  } catch {
    throw new MediaNotFoundError(`Média introuvable : ${rel}`);
  }
  const realRoot = fs.realpathSync.native(root);
  if (!isInside(realRoot, real)) throw new UnsafePathError("Chemin de média invalide.");
  if (!fs.statSync(real).isFile()) throw new MediaNotFoundError(`Média introuvable : ${rel}`);
  return real;
}

export class MediaNotFoundError extends Error {}

/** Chemin relatif (avec « / ») d'un fichier situé sous la racine. */
export function toRelative(root: string, absolute: string): string {
  return path.relative(root, absolute).split(path.sep).join("/");
}
