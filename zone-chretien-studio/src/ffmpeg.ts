import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * ffmpeg / ffprobe livrés avec Remotion (paquet du compositeur Windows) :
 * rien à installer dans Windows, ils sont dans node_modules sur le disque.
 */
function binDir(): string {
  const req = createRequire(require.resolve("@remotion/renderer/package.json"));
  return path.dirname(req.resolve("@remotion/compositor-win32-x64-msvc/package.json"));
}

function run(exe: "ffmpeg" | "ffprobe", args: string[], timeoutMs: number): Promise<string> {
  return runBoth(exe, args, timeoutMs).then((r) => r.out);
}

/** Comme run(), mais renvoie aussi la sortie d'erreur (journal des filtres de ffmpeg). */
function runBoth(exe: "ffmpeg" | "ffprobe", args: string[], timeoutMs: number): Promise<{ out: string; err: string }> {
  return new Promise((resolve, reject) => {
    const dir = binDir();
    const child = spawn(path.join(dir, `${exe}.exe`), args, { cwd: dir, windowsHide: true });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${exe} a échoué (code ${code}) : ${err.trim().split("\n").pop() ?? ""}`));
    });
  });
}

/** Durée d'un fichier audio ou vidéo, en secondes (null si inconnue). */
export async function probeDuration(file: string): Promise<number | null> {
  try {
    const out = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], 20_000);
    const n = Number.parseFloat(out.trim());
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  } catch {
    return null;
  }
}

/** Miniature JPEG (320 px de large) d'une image ou d'une vidéo. */
export async function makeThumbnail(input: string, output: string, isVideo: boolean): Promise<void> {
  const seek = isVideo ? ["-ss", "1"] : [];
  await run(
    "ffmpeg",
    ["-v", "error", "-y", ...seek, "-i", input, "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "4", output],
    30_000,
  ).catch(async (e) => {
    // Vidéo de moins d'une seconde : on reprend la toute première image.
    if (!isVideo) throw e;
    await run("ffmpeg", ["-v", "error", "-y", "-i", input, "-frames:v", "1", "-vf", "scale=320:-2", "-q:v", "4", output], 30_000);
  });
}

/**
 * Convertit un enregistrement du navigateur (.webm / .ogg de MediaRecorder,
 * souvent sans durée dans l'en-tête) en .m4a (AAC) : durée fiable et lecture
 * sans surprise à l'aperçu comme au rendu.
 */
export async function convertToM4a(input: string, output: string): Promise<void> {
  // « -f mp4 » : le ffmpeg allégé livré avec Remotion n'associe aucun format à l'extension .m4a.
  await run(
    "ffmpeg",
    ["-v", "error", "-y", "-i", input, "-vn", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-f", "mp4", output],
    120_000,
  );
}

/** Convertit une voix off en WAV 16 kHz mono (format attendu par Whisper). */
export async function convertToWav16k(input: string, output: string): Promise<void> {
  await run("ffmpeg", ["-v", "error", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", "-f", "wav", output], 120_000);
}

export type Silence = { start: number; end: number };

/** Lit le journal du filtre silencedetect de ffmpeg (logique pure, testée). */
export function parseSilences(log: string, durationSeconds: number): Silence[] {
  const out: Silence[] = [];
  let open: number | null = null;
  for (const line of log.split(/\r?\n/)) {
    const s = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (s) open = Math.max(0, Number.parseFloat(s[1]));
    const e = /silence_end:\s*([\d.]+)/.exec(line);
    if (e && open !== null) {
      out.push({ start: open, end: Number.parseFloat(e[1]) });
      open = null;
    }
  }
  // Silence qui dure jusqu'à la fin du fichier : pas de « silence_end ».
  if (open !== null) out.push({ start: open, end: durationSeconds });
  return out;
}

/** Silences d'au moins `minSeconds` sous `noiseDb` (dB), en secondes. */
export async function detectSilences(file: string, durationSeconds: number, noiseDb = -40, minSeconds = 0.3): Promise<Silence[]> {
  const { err } = await runBoth("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `silencedetect=noise=${noiseDb}dB:d=${minSeconds}`, "-f", "null", "-"], 120_000);
  return parseSilences(err, durationSeconds);
}
