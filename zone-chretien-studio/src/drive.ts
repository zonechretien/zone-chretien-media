import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { APP_ID } from "./config";

/**
 * Détection de la bibliothèque Zone-Chrétien sur un disque externe.
 *
 * La bibliothèque est un dossier dédié à la racine d'un lecteur
 * (`X:\Zone-Chretien-Studio`, nom réglable par `dossierBibliotheque` dans
 * config.local.json) qui contient le fichier repère `zc-studio.json`. Le
 * reste du disque n'est jamais lu. La lettre du disque peut changer d'un
 * branchement à l'autre : elle n'est jamais enregistrée, on la retrouve à
 * chaque démarrage.
 */

export const MARKER_FILE = "zc-studio.json";

/** Sous-dossiers de la bibliothèque. */
export const LIBRARY_FOLDERS = ["Fonds", "Musiques", "VoixOff", "Logos", "Polices", "Exports"] as const;
export type LibraryFolder = (typeof LIBRARY_FOLDERS)[number];

export const markerSchema = z.object({
  application: z.literal(APP_ID),
  nom: z.string().min(1),
  version: z.number().int().positive(),
});
export type Marker = z.infer<typeof markerSchema>;

export type Library = { root: string; marker: Marker };

export const DRIVE_NOT_FOUND_MESSAGE =
  "Disque Zone-Chrétien non détecté. Branche le disque puis clique sur Réessayer.";

/** Accès au système de fichiers, injectable pour les tests. */
export type DriveFs = {
  exists: (p: string) => boolean;
  readText: (p: string) => string;
  /** Vrai si le chemin est un vrai dossier (pas un lien symbolique ni une jonction). */
  isRealDirectory: (p: string) => boolean;
};

const realFs: DriveFs = {
  exists: (p) => {
    try {
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  },
  readText: (p) => fs.readFileSync(p, "utf8"),
  isRealDirectory: (p) => {
    try {
      return fs.lstatSync(p).isDirectory();
    } catch {
      return false;
    }
  },
};

/** Racines de lecteurs Windows possibles, de C: à Z: (A: et B: sont des lecteurs de disquettes). */
export function windowsDriveRoots(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${String.fromCharCode(67 + i)}:\\`);
}

/**
 * Dossiers de bibliothèque possibles, dans l'ordre de recherche : dossier
 * forcé (développement, variable ZC_BIBLIOTHEQUE), sinon <lecteur>\<dossier>
 * sur le disque où se trouve le studio lui-même, puis sur toutes les autres lettres.
 */
export function candidateLibraries(opts: { override?: string; studioDir: string; platform: NodeJS.Platform; folderName: string }): string[] {
  if (opts.override) return [path.resolve(opts.override)];
  const own = path.parse(opts.studioDir).root;
  const roots = opts.platform !== "win32" ? [own] : [own.toUpperCase(), ...windowsDriveRoots().filter((r) => r !== own.toUpperCase())];
  return roots.map((root) => path.join(root, opts.folderName));
}

/**
 * Premier dossier candidat qui contient un repère valide. Un dossier qui est
 * un lien symbolique ou une jonction est ignoré : la bibliothèque doit être
 * un vrai dossier, pour que rien ne puisse être servi depuis ailleurs.
 */
export function detectLibrary(candidates: string[], fsApi: DriveFs = realFs): Library | null {
  for (const root of candidates) {
    if (!fsApi.isRealDirectory(root)) continue;
    const markerPath = path.join(root, MARKER_FILE);
    if (!fsApi.exists(markerPath)) continue;
    try {
      const marker = markerSchema.parse(JSON.parse(fsApi.readText(markerPath)));
      return { root, marker };
    } catch {
      // Repère illisible ou d'une autre application : on continue la recherche.
    }
  }
  return null;
}

/** Crée les dossiers standards manquants (jamais de suppression). */
export function ensureLibraryFolders(root: string): void {
  for (const folder of LIBRARY_FOLDERS) fs.mkdirSync(path.join(root, folder), { recursive: true });
}
