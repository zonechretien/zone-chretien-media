import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { STUDIO_DIR } from "./paths";

/**
 * Configuration du studio : config.json (versionné, valeurs par défaut) puis
 * config.local.json (facultatif, non versionné) qui le complète — par exemple
 * pour ajouter l'adresse exacte d'un déploiement de prévisualisation Vercel ou
 * changer le nom du dossier de la bibliothèque.
 */

/** Nom d'un dossier unique à la racine d'un lecteur : ni séparateur, ni lettre de lecteur, ni « . » / « .. ». */
export function isValidFolderName(name: string): boolean {
  return /^[^\\/:*?"<>|\0]{1,64}$/.test(name) && name.trim() === name && !name.startsWith(".") && !name.endsWith(".");
}

const configSchema = z.object({
  port: z.number().int().min(1024).max(65535),
  /** Origines exactes (schéma + hôte + port) autorisées à appeler le studio. */
  originesAutorisees: z.array(z.string().url()),
  /** Dossier de la bibliothèque, cherché à la racine de chaque lecteur (X:\<dossier>\zc-studio.json). */
  dossierBibliotheque: z.string().refine(isValidFolderName, 'nom de dossier invalide (un seul dossier, sans \\ / : * ? " < > |)'),
  /** Modèle Whisper à utiliser s'il est installé (sinon le meilleur présent dans .whisper/modeles). */
  modeleWhisper: z.enum(["tiny", "small", "medium", "large-v3-turbo"]).optional(),
});
export type StudioConfig = z.infer<typeof configSchema>;

export const APP_ID = "com.lepolo.zc-studio";

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function loadConfig(dir = STUDIO_DIR): StudioConfig {
  const base = configSchema.parse(readJson(path.join(dir, "config.json")));
  const localFile = path.join(dir, "config.local.json");
  if (!fs.existsSync(localFile)) return base;
  const local = configSchema.partial().parse(readJson(localFile));
  return {
    port: local.port ?? base.port,
    originesAutorisees: [...new Set([...base.originesAutorisees, ...(local.originesAutorisees ?? [])])],
    dossierBibliotheque: local.dossierBibliotheque ?? base.dossierBibliotheque,
    modeleWhisper: local.modeleWhisper ?? base.modeleWhisper,
  };
}
