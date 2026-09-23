import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { STUDIO_DIR } from "./paths";

/**
 * Configuration du studio : config.json (versionné, valeurs par défaut) puis
 * config.local.json (facultatif, non versionné) qui le complète — par exemple
 * pour ajouter l'adresse exacte d'un déploiement de prévisualisation Vercel.
 */
const configSchema = z.object({
  port: z.number().int().min(1024).max(65535),
  /** Origines exactes (schéma + hôte + port) autorisées à appeler le studio. */
  originesAutorisees: z.array(z.string().url()),
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
  };
}
