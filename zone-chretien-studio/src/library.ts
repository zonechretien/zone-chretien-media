import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { LIBRARY_FOLDERS } from "./drive";
import { makeThumbnail, probeDuration } from "./ffmpeg";
import { FOLDER_KINDS, mediaType, type MediaKind } from "./media-types";
import { toRelative } from "./safe-path";

/** Dossier caché du disque où sont rangées les miniatures générées. */
export const CACHE_DIR = ".zc-cache";

export type LibraryItem = {
  /** Chemin relatif à la racine du disque, avec « / ». */
  chemin: string;
  nom: string;
  dossier: string;
  type: MediaKind;
  taille: number;
  modifieLe: string;
  miniature: boolean;
};

/** Liste récursive des médias reconnus de chaque dossier (dossiers cachés ignorés). */
export function listLibrary(root: string): Record<string, LibraryItem[]> {
  const result: Record<string, LibraryItem[]> = {};
  for (const folder of LIBRARY_FOLDERS) {
    const items: LibraryItem[] = [];
    const walk = (dir: string, depth: number) => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (depth < 4) walk(abs, depth + 1);
          continue;
        }
        if (!e.isFile()) continue; // liens symboliques ignorés
        const t = mediaType(e.name, folder);
        if (!t || !FOLDER_KINDS[folder].includes(t.kind)) continue;
        const stat = fs.statSync(abs);
        items.push({
          chemin: toRelative(root, abs),
          nom: e.name,
          dossier: folder,
          type: t.kind,
          taille: stat.size,
          modifieLe: stat.mtime.toISOString(),
          miniature: t.kind === "image" || t.kind === "video",
        });
      }
    };
    walk(path.join(root, folder), 0);
    items.sort((a, b) => a.chemin.localeCompare(b.chemin, "fr"));
    result[folder] = items;
  }
  return result;
}

// Au plus 2 miniatures générées en même temps, pour ne pas saturer le PC.
let running = 0;
const waiting: (() => void)[] = [];
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= 2) await new Promise<void>((r) => waiting.push(r));
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

const inFlight = new Map<string, Promise<string>>();

/**
 * Miniature mise en cache sur le disque. La clé dépend du chemin, de la
 * taille et de la date de modification : un fichier remplacé est régénéré.
 */
export function thumbnailFor(root: string, absolute: string, rel: string, isVideo: boolean): Promise<string> {
  const stat = fs.statSync(absolute);
  const key = crypto.createHash("sha1").update(`${rel}|${stat.size}|${stat.mtimeMs}`).digest("hex");
  const out = path.join(root, CACHE_DIR, "miniatures", `${key}.jpg`);
  if (fs.existsSync(out)) return Promise.resolve(out);
  const pending = inFlight.get(out);
  if (pending) return pending;

  const job = limited(async () => {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const tmp = `${out}.${process.pid}.tmp.jpg`;
    await makeThumbnail(absolute, tmp, isVideo);
    fs.renameSync(tmp, out);
    return out;
  }).finally(() => inFlight.delete(out));
  inFlight.set(out, job);
  return job;
}

export { probeDuration };
