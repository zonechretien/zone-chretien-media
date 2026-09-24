import path from "node:path";

/**
 * Chemins du studio, tous calculés depuis l'emplacement de ce fichier : rien
 * n'est codé en dur, le dépôt peut vivre sur n'importe quelle lettre de disque.
 */
export const STUDIO_DIR = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(STUDIO_DIR, "..");

/** Point d'entrée Remotion (templates partagés avec le CMS). */
export const REMOTION_ENTRY = path.join(REPO_ROOT, "remotion", "index.ts");
/** Polices et fichiers de marque, servis au rendu comme dossier public Remotion. */
export const BRAND_PUBLIC_DIR = path.join(REPO_ROOT, "public", "reels");
/** Dépendances du studio (prioritaires sur celles du CMS lors du bundle). */
export const STUDIO_NODE_MODULES = path.join(STUDIO_DIR, "node_modules");
