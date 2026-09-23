import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { APP_ID } from "./config";

/**
 * Détection du disque externe Zone-Chrétien.
 *
 * Un fichier repère `zc-studio.json` à la racine du disque identifie la
 * bibliothèque. La lettre du disque peut changer d'un branchement à l'autre :
 * elle n'est jamais enregistrée, on la retrouve à chaque démarrage.
 */

export const MARKER_FILE = "zc-studio.json";

/** Dossiers de la bibliothèque (à la racine du disque). */
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
};

/** Racines de lecteurs Windows possibles, de C: à Z: (A: et B: sont des lecteurs de disquettes). */
export function windowsDriveRoots(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${String.fromCharCode(67 + i)}:\\`);
}

/**
 * Ordre de recherche : dossier forcé (développement), puis le disque où se
 * trouve le studio lui-même (cas normal : tout est sur le disque externe),
 * puis toutes les autres lettres.
 */
export function candidateRoots(opts: { override?: string; studioDir: string; platform: NodeJS.Platform }): string[] {
  if (opts.override) return [path.resolve(opts.override)];
  if (opts.platform !== "win32") return [path.parse(opts.studioDir).root];
  const own = path.parse(opts.studioDir).root.toUpperCase();
  return [own, ...windowsDriveRoots().filter((r) => r !== own)];
}

export function detectLibrary(roots: string[], fsApi: DriveFs = realFs): Library | null {
  for (const root of roots) {
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
