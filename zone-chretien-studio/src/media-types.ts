import path from "node:path";

export type MediaKind = "image" | "video" | "audio" | "font";

/** Formats acceptés (lus par le navigateur de l'aperçu ET par le rendu). */
const TYPES: Record<string, { mime: string; kind: MediaKind }> = {
  ".jpg": { mime: "image/jpeg", kind: "image" },
  ".jpeg": { mime: "image/jpeg", kind: "image" },
  ".png": { mime: "image/png", kind: "image" },
  ".webp": { mime: "image/webp", kind: "image" },
  ".mp4": { mime: "video/mp4", kind: "video" },
  ".mov": { mime: "video/quicktime", kind: "video" },
  ".webm": { mime: "video/webm", kind: "video" },
  ".mp3": { mime: "audio/mpeg", kind: "audio" },
  ".m4a": { mime: "audio/mp4", kind: "audio" },
  ".aac": { mime: "audio/aac", kind: "audio" },
  ".wav": { mime: "audio/wav", kind: "audio" },
  ".ogg": { mime: "audio/ogg", kind: "audio" },
  ".opus": { mime: "audio/ogg", kind: "audio" },
  ".ttf": { mime: "font/ttf", kind: "font" },
  ".otf": { mime: "font/otf", kind: "font" },
  ".woff": { mime: "font/woff", kind: "font" },
  ".woff2": { mime: "font/woff2", kind: "font" },
};

export function mediaType(file: string, folder?: string): { mime: string; kind: MediaKind } | null {
  const t = TYPES[path.extname(file).toLowerCase()];
  if (!t) return null;
  // Les voix off enregistrées dans le navigateur sont des .webm audio seul.
  if (t.kind === "video" && folder === "VoixOff" && path.extname(file).toLowerCase() === ".webm") {
    return { mime: "audio/webm", kind: "audio" };
  }
  return t;
}

/** Types de fichiers attendus dans chaque dossier de la bibliothèque. */
export const FOLDER_KINDS: Record<string, MediaKind[]> = {
  Fonds: ["image", "video"],
  Musiques: ["audio"],
  VoixOff: ["audio"],
  Logos: ["image"],
  Polices: ["font"],
  Exports: ["video"],
};
