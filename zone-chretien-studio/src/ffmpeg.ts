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
      if (code === 0) resolve(out);
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
