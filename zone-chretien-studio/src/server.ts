/**
 * Serveur local du studio Zone-Chrétien (com.lepolo.zc-studio).
 *
 * Sécurité :
 * - écoute uniquement sur 127.0.0.1 (jamais exposé au réseau, pas de pare-feu) ;
 * - en-tête Host vérifié (protection contre le « DNS rebinding ») ;
 * - CORS limité aux origines de config.json ;
 * - toute requête d'écriture exige l'en-tête X-ZC-Studio, ce qui force le
 *   navigateur à demander l'autorisation (pré-vol CORS) : un site non
 *   autorisé ne peut rien déclencher ;
 * - médias en lecture seule, chemins vérifiés (voir safe-path.ts).
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { ensureBrowser } from "@remotion/renderer";
import { APP_ID, loadConfig } from "./config";
import {
  DRIVE_NOT_FOUND_MESSAGE,
  MARKER_FILE,
  candidateLibraries,
  detectLibrary,
  ensureLibraryFolders,
  type Library,
} from "./drive";
import { convertToM4a, probeDuration } from "./ffmpeg";
import { isAllowedHost, isLoopbackOrigin, isOriginAllowed, parseRange, fileTimestamp } from "./http-utils";
import { RenderQueue } from "./jobs";
import { listLibrary, thumbnailFor } from "./library";
import { mediaType } from "./media-types";
import { STUDIO_DIR } from "./paths";
import { explainRenderError, getServeUrl, useStudioWorkingDir } from "./render";
import { MediaNotFoundError, UnsafePathError, resolveLibraryFile, toRelative } from "./safe-path";
import { aboutPage } from "./about-page";
import { SyncQueue } from "./sync-jobs";
import { synchronize, whisperState } from "./whisper";

useStudioWorkingDir();
const config = loadConfig();
const PORT = config.port;
const SELF_ORIGINS = [`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`];
const ALLOWED = [...config.originesAutorisees, ...SELF_ORIGINS];
const VERSION = (JSON.parse(fs.readFileSync(path.join(STUDIO_DIR, "package.json"), "utf8")) as { version: string }).version;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Disque et navigateur de rendu
// ---------------------------------------------------------------------------

let library: Library | null = null;

function detect(): Library | null {
  library = detectLibrary(
    candidateLibraries({
      override: process.env.ZC_BIBLIOTHEQUE,
      studioDir: STUDIO_DIR,
      platform: process.platform,
      folderName: config.dossierBibliotheque,
    }),
  );
  if (library) ensureLibraryFolders(library.root);
  return library;
}

/** Bibliothèque courante ; relance la détection si le disque a été débranché. */
function currentLibrary(): Library | null {
  if (library && fs.existsSync(path.join(library.root, MARKER_FILE))) return library;
  return detect();
}

let browser: { etat: "verification" | "pret" | "absent"; message: string | null } = { etat: "verification", message: null };
async function checkBrowser() {
  try {
    await ensureBrowser();
    browser = { etat: "pret", message: null };
  } catch (e) {
    browser = { etat: "absent", message: explainRenderError(e) };
  }
}

const queue = new RenderQueue(() => currentLibrary()?.root ?? null, `http://127.0.0.1:${PORT}/media/`);

// Synchronisation du texte sur la voix off (Whisper, hors ligne).
const whisper = () => whisperState(config.modeleWhisper);
const syncQueue = new SyncQueue(
  async ({ chemin, ...rest }) => {
    const lib = currentLibrary();
    if (!lib) throw new Error(DRIVE_NOT_FOUND_MESSAGE);
    return synchronize({ file: resolveLibraryFile(lib.root, chemin), ...rest });
  },
  () => {
    const w = whisper();
    return w.etat === "pret" ? w.modele : null;
  },
);
/** Nombre maximal de mots d'un texte à synchroniser (le plus long des templates en compte moins de 400). */
const MAX_SYNC_WORDS = 2000;

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

type Req = http.IncomingMessage;
type Res = http.ServerResponse;

function corsHeaders(req: Req): Record<string, string> {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin, ALLOWED)) {
    return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  }
  return { Vary: "Origin" };
}

function json(req: Req, res: Res, status: number, body: unknown) {
  res.writeHead(status, { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function fail(req: Req, res: Res, status: number, erreur: string) {
  json(req, res, status, { erreur });
}

function readBody(req: Req, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("TROP_GROS"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function driveState() {
  const lib = currentLibrary();
  return lib
    ? { detecte: true as const, lettre: path.parse(lib.root).root.replace(/\\$/, ""), dossier: lib.root, nom: lib.marker.nom }
    : { detecte: false as const, message: DRIVE_NOT_FOUND_MESSAGE };
}

function status() {
  return {
    application: APP_ID,
    nom: "Zone-Chrétien Reels Studio",
    version: VERSION,
    developpePar: "Lepolo",
    disque: driveState(),
    navigateurRendu: browser,
    synchronisation: whisper(),
    rendusEnCours: queue.list().filter((j) => ["en-attente", "preparation", "rendu"].includes(j.statut)).length,
  };
}

// ---------------------------------------------------------------------------
// Médias (lecture seule, Range)
// ---------------------------------------------------------------------------

function serveMedia(req: Req, res: Res, rel: string): void {
  const lib = currentLibrary();
  if (!lib) return fail(req, res, 503, DRIVE_NOT_FOUND_MESSAGE);

  let file: string;
  try {
    file = resolveLibraryFile(lib.root, rel);
  } catch (e) {
    if (e instanceof UnsafePathError) return fail(req, res, 400, e.message);
    if (e instanceof MediaNotFoundError) return fail(req, res, 404, e.message);
    throw e;
  }
  const folder = rel.split("/")[0];
  const type = mediaType(file, folder);
  if (!type) return fail(req, res, 415, "Format de média non supporté.");

  const size = fs.statSync(file).size;
  const range = parseRange(req.headers.range, size);
  const headers: Record<string, string> = {
    ...corsHeaders(req),
    "Content-Type": type.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache",
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
  if (range === "unsatisfiable") {
    res.writeHead(416, { ...headers, "Content-Range": `bytes */${size}` });
    res.end();
    return;
  }
  const { start, end } = range ?? { start: 0, end: size - 1 };
  res.writeHead(range ? 206 : 200, {
    ...headers,
    "Content-Length": String(size === 0 ? 0 : end - start + 1),
    ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
  });
  if (req.method === "HEAD" || size === 0) {
    res.end();
    return;
  }
  fs.createReadStream(file, { start, end }).pipe(res);
}

/** Les médias peuvent être chargés par une balise <img>/<video> (sans Origin) : on vérifie alors le Referer. */
function mediaRequestAllowed(req: Req): boolean {
  const check = (value: string) => {
    try {
      const o = new URL(value).origin;
      return isOriginAllowed(o, ALLOWED) || isLoopbackOrigin(o);
    } catch {
      return false;
    }
  };
  if (req.headers.origin && !check(req.headers.origin)) return false;
  if (req.headers.referer && !check(req.headers.referer)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
};

async function handle(req: Req, res: Res): Promise<void> {
  if (!isAllowedHost(req.headers.host, PORT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return void res.end("Hôte non autorisé.");
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const method = req.method ?? "GET";
  const origin = req.headers.origin;

  // Pré-vol CORS (dont l'ancien en-tête Private Network Access de Chrome).
  if (method === "OPTIONS") {
    if (!isOriginAllowed(origin, ALLOWED)) {
      res.writeHead(403, { Vary: "Origin" });
      return void res.end();
    }
    res.writeHead(204, {
      ...corsHeaders(req),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range, X-ZC-Studio",
      "Access-Control-Allow-Private-Network": "true",
      "Access-Control-Max-Age": "600",
    });
    return void res.end();
  }

  if (url.pathname.startsWith("/media/")) {
    if (method !== "GET" && method !== "HEAD") return fail(req, res, 405, "Méthode non autorisée.");
    if (!mediaRequestAllowed(req)) return fail(req, res, 403, "Origine non autorisée.");
    let rel: string;
    try {
      rel = url.pathname.slice("/media/".length).split("/").map(decodeURIComponent).join("/");
    } catch {
      return fail(req, res, 400, "Chemin de média invalide.");
    }
    return serveMedia(req, res, rel);
  }

  if (url.pathname === "/" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    return void res.end(aboutPage(status(), ALLOWED));
  }

  if (!url.pathname.startsWith("/api/")) return fail(req, res, 404, "Adresse inconnue.");
  if (origin && !isOriginAllowed(origin, ALLOWED)) return fail(req, res, 403, "Origine non autorisée.");
  if (method === "POST" && req.headers["x-zc-studio"] !== "1") {
    return fail(req, res, 403, "En-tête X-ZC-Studio manquant.");
  }

  const route = `${method} ${url.pathname}`;

  if (route === "GET /api/etat") return json(req, res, 200, status());
  if (route === "POST /api/disque/detecter") {
    detect();
    return json(req, res, 200, status());
  }

  if (route === "GET /api/bibliotheque") {
    const lib = currentLibrary();
    if (!lib) return fail(req, res, 503, DRIVE_NOT_FOUND_MESSAGE);
    return json(req, res, 200, { dossiers: listLibrary(lib.root) });
  }

  if (route === "GET /api/miniature" || route === "GET /api/media-info") {
    const lib = currentLibrary();
    if (!lib) return fail(req, res, 503, DRIVE_NOT_FOUND_MESSAGE);
    const rel = url.searchParams.get("chemin") ?? "";
    let file: string;
    try {
      file = resolveLibraryFile(lib.root, rel);
    } catch (e) {
      if (e instanceof UnsafePathError) return fail(req, res, 400, e.message);
      if (e instanceof MediaNotFoundError) return fail(req, res, 404, e.message);
      throw e;
    }
    const type = mediaType(file, rel.split("/")[0]);
    if (!type) return fail(req, res, 415, "Format de média non supporté.");

    if (route === "GET /api/media-info") {
      const duree = type.kind === "audio" || type.kind === "video" ? await probeDuration(file) : null;
      return json(req, res, 200, { chemin: rel, type: type.kind, dureeSecondes: duree });
    }
    if (type.kind !== "image" && type.kind !== "video") return fail(req, res, 415, "Pas de miniature pour ce type de fichier.");
    try {
      const thumb = await thumbnailFor(lib.root, file, rel, type.kind === "video");
      res.writeHead(200, { ...corsHeaders(req), "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400", "Cross-Origin-Resource-Policy": "cross-origin" });
      fs.createReadStream(thumb).pipe(res);
      return;
    } catch {
      return fail(req, res, 415, "Impossible de lire ce média (format non supporté ou fichier abîmé).");
    }
  }

  if (route === "GET /api/rendus") return json(req, res, 200, { rendus: queue.list() });

  if (route === "POST /api/rendus") {
    let body: { templateId?: unknown; titre?: unknown; props?: unknown };
    try {
      body = JSON.parse((await readBody(req, MAX_JSON_BYTES)).toString("utf8"));
    } catch {
      return fail(req, res, 400, "Demande d'export invalide.");
    }
    if (typeof body.templateId !== "string" || !/^[A-Za-z0-9]+$/.test(body.templateId)) return fail(req, res, 400, "Template inconnu.");
    if (!body.props || typeof body.props !== "object" || Array.isArray(body.props)) return fail(req, res, 400, "Données du Reel manquantes.");
    const titre = typeof body.titre === "string" ? body.titre.slice(0, 120) : body.templateId;
    const job = queue.add(body.templateId, titre, body.props as Record<string, unknown>);
    return json(req, res, 202, job);
  }

  const jobMatch = /^\/api\/rendus\/([0-9a-f-]{36})(\/annuler)?$/.exec(url.pathname);
  if (jobMatch) {
    const [, id, annuler] = jobMatch;
    if (method === "GET" && !annuler) {
      const job = queue.get(id);
      return job ? json(req, res, 200, job) : fail(req, res, 404, "Rendu introuvable.");
    }
    if (method === "POST" && annuler) {
      const job = queue.cancel(id);
      return job ? json(req, res, 200, job) : fail(req, res, 404, "Rendu introuvable.");
    }
  }

  if (route === "POST /api/synchronisations") {
    let body: { chemin?: unknown; mots?: unknown; langue?: unknown };
    try {
      body = JSON.parse((await readBody(req, MAX_JSON_BYTES)).toString("utf8"));
    } catch {
      return fail(req, res, 400, "Demande de synchronisation invalide.");
    }
    const lib = currentLibrary();
    if (!lib) return fail(req, res, 503, DRIVE_NOT_FOUND_MESSAGE);
    if (typeof body.chemin !== "string" || !body.chemin.startsWith("VoixOff/")) return fail(req, res, 400, "Voix off attendue dans le dossier VoixOff.");
    try {
      const file = resolveLibraryFile(lib.root, body.chemin);
      if (mediaType(file, "VoixOff")?.kind !== "audio") return fail(req, res, 415, "Format audio non supporté.");
    } catch (e) {
      if (e instanceof UnsafePathError) return fail(req, res, 400, e.message);
      if (e instanceof MediaNotFoundError) return fail(req, res, 404, e.message);
      throw e;
    }
    const mots = body.mots;
    if (!Array.isArray(mots) || mots.length === 0 || mots.length > MAX_SYNC_WORDS || !mots.every((m) => typeof m === "string" && m.length > 0 && m.length <= 100)) {
      return fail(req, res, 400, "Texte à synchroniser invalide.");
    }
    if (body.langue !== "fr" && body.langue !== "ht") return fail(req, res, 400, "Langue inconnue (fr ou ht).");
    const w = whisper();
    if (w.etat !== "pret") return fail(req, res, 503, w.message);
    return json(req, res, 202, syncQueue.add(body.chemin, mots as string[], body.langue));
  }

  const syncMatch = /^\/api\/synchronisations\/([0-9a-f-]{36})(\/annuler)?$/.exec(url.pathname);
  if (syncMatch) {
    const [, id, annuler] = syncMatch;
    const job = method === "GET" && !annuler ? syncQueue.get(id) : method === "POST" && annuler ? syncQueue.cancel(id) : undefined;
    if (job === undefined) return fail(req, res, 405, "Méthode non autorisée.");
    return job ? json(req, res, 200, job) : fail(req, res, 404, "Synchronisation introuvable.");
  }

  if (route === "POST /api/voix-off") {
    const lib = currentLibrary();
    if (!lib) return fail(req, res, 503, DRIVE_NOT_FOUND_MESSAGE);
    const mime = (req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    const ext = AUDIO_EXTENSIONS[mime];
    if (!ext) return fail(req, res, 415, "Format audio non supporté pour la voix off.");
    let data: Buffer;
    try {
      data = await readBody(req, MAX_AUDIO_BYTES);
    } catch {
      return fail(req, res, 413, "Enregistrement trop volumineux (50 Mo maximum).");
    }
    if (data.length === 0) return fail(req, res, 400, "Enregistrement vide.");
    const dir = path.join(lib.root, "VoixOff");
    fs.mkdirSync(dir, { recursive: true });
    const base = path.join(dir, `voix-off_${fileTimestamp(new Date())}`);
    let file = `${base}${ext}`;
    try {
      fs.writeFileSync(file, data, { flag: "wx" });
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      return fail(req, res, 500, code === "ENOSPC" ? "Espace disque insuffisant." : "Impossible d'enregistrer la voix off sur le disque.");
    }
    // Les enregistrements du navigateur (.webm, .ogg) sont convertis en .m4a :
    // durée fiable et lecture identique à l'aperçu et au rendu. En cas d'échec
    // de la conversion, le fichier d'origine est conservé.
    if (ext === ".webm" || ext === ".ogg") {
      const m4a = `${base}.m4a`;
      try {
        await convertToM4a(file, m4a);
        fs.rmSync(file);
        file = m4a;
      } catch {
        fs.rmSync(m4a, { force: true });
      }
    }
    return json(req, res, 201, { chemin: toRelative(lib.root, file), dureeSecondes: await probeDuration(file) });
  }

  return fail(req, res, 404, "Adresse inconnue.");
}

// ---------------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    if (!res.headersSent) fail(req, res, 500, "Erreur interne du studio.");
    else res.end();
  });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Le port ${PORT} est déjà utilisé : le studio est peut-être déjà lancé dans une autre fenêtre.`);
  } else {
    console.error(`Impossible de démarrer le studio : ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  const lib = detect();
  console.log("");
  console.log("  Zone-Chrétien Reels Studio — développé par Lepolo");
  console.log(`  Adresse : http://127.0.0.1:${PORT}`);
  console.log(lib ? `  Disque  : ${lib.marker.nom} (${lib.root})` : `  ${DRIVE_NOT_FOUND_MESSAGE} (dossier cherché : <lecteur>:\\${config.dossierBibliotheque})`);
  console.log("  Laisse cette fenêtre ouverte pendant l'utilisation. Ctrl+C pour arrêter.");
  console.log("");
  void checkBrowser();
  // Préparation des templates en arrière-plan : le premier export sera plus rapide.
  getServeUrl().catch((e) => console.error(`Préparation des templates impossible : ${explainRenderError(e)}`));
});
