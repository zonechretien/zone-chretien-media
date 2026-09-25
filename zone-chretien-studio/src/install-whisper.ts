/**
 * Installe la synchronisation automatique (une seule fois, connexion Internet
 * requise) : whisper.cpp et un modèle, dans zone-chretien-studio/.whisper/.
 * Aucun droit administrateur : simple téléchargement vérifié (SHA-256) et
 * décompression avec Expand-Archive, rien n'est écrit dans Windows.
 *
 *   npm run whisper                        → modèle par défaut (config ou large-v3-turbo)
 *   npm run whisper -- --modele small      → autre modèle
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { loadConfig } from "./config";
import { MODELS, WHISPER_BUILD, WHISPER_DIR, WHISPER_EXE, modelFile, modelUrl, type ModelId } from "./whisper";

async function download(url: string, dest: string, sha256: string, label: string): Promise<void> {
  const part = `${dest}.partiel`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`Téléchargement impossible (${res.status}) : ${url}`);
  const total = Number(res.headers.get("content-length")) || 0;
  const hash = crypto.createHash("sha256");
  let done = 0;
  let lastShown = -1;
  const body = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
  body.on("data", (chunk: Buffer) => {
    hash.update(chunk);
    done += chunk.length;
    const pct = total ? Math.floor((done / total) * 100) : -1;
    if (pct !== lastShown && pct % 5 === 0) {
      lastShown = pct;
      process.stdout.write(`\r  ${label} : ${pct} % (${Math.round(done / 1e6)} Mo)   `);
    }
  });
  await pipeline(body, fs.createWriteStream(part));
  process.stdout.write("\n");
  const got = hash.digest("hex");
  if (got !== sha256) {
    fs.rmSync(part, { force: true });
    throw new Error(`Fichier corrompu ou modifié (${label}) : empreinte ${got}, attendue ${sha256}. Rien n'a été installé.`);
  }
  fs.renameSync(part, dest);
}

function freeBytes(dir: string): number | null {
  try {
    const s = fs.statfsSync(dir);
    return s.bavail * s.bsize;
  } catch {
    return null;
  }
}

async function main() {
  const i = process.argv.indexOf("--modele");
  const requested = (i >= 0 ? process.argv[i + 1] : undefined) ?? loadConfig().modeleWhisper ?? "large-v3-turbo";
  if (!(requested in MODELS)) throw new Error(`Modèle inconnu : ${requested} (choix : ${Object.keys(MODELS).join(", ")}).`);
  const model = requested as ModelId;
  fs.mkdirSync(path.join(WHISPER_DIR, "modeles"), { recursive: true });

  const free = freeBytes(WHISPER_DIR);
  const need = MODELS[model].bytes + 50e6;
  if (free !== null && free < need * 1.2) throw new Error(`Espace disque insuffisant : ${Math.round(free / 1e9)} Go libres, ${Math.ceil((need * 1.2) / 1e9)} Go nécessaires.`);

  if (!fs.existsSync(WHISPER_EXE)) {
    console.log(`whisper.cpp ${WHISPER_BUILD.version}…`);
    const zip = path.join(WHISPER_DIR, "whisper-bin-x64.zip");
    await download(WHISPER_BUILD.url, zip, WHISPER_BUILD.sha256, "whisper.cpp");
    const dest = path.dirname(path.dirname(WHISPER_EXE));
    const r = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", "Expand-Archive -Force -LiteralPath $env:ZC_ZIP -DestinationPath $env:ZC_DEST -ErrorAction Stop"],
      { env: { ...process.env, ZC_ZIP: zip, ZC_DEST: dest }, stdio: "inherit" },
    );
    fs.rmSync(zip, { force: true });
    if (r.status !== 0 || !fs.existsSync(WHISPER_EXE)) throw new Error("Décompression de whisper.cpp impossible.");
  } else {
    console.log(`whisper.cpp ${WHISPER_BUILD.version} : déjà installé.`);
  }

  // Vérification : Windows accepte-t-il de lancer l'exécutable (non signé) ?
  const check = spawnSync(WHISPER_EXE, ["--help"], { encoding: "utf8", windowsHide: true });
  if (check.error || check.status !== 0) {
    throw new Error(`Windows bloque l'exécution de whisper.cpp (${check.error?.message ?? `code ${check.status}`}). Utilisez le calage manuel dans l'éditeur.`);
  }

  const file = modelFile(model);
  if (fs.existsSync(file) && fs.statSync(file).size === MODELS[model].bytes) {
    console.log(`Modèle ${model} : déjà installé.`);
  } else {
    console.log(`Modèle ${model} (${Math.round(MODELS[model].bytes / 1e6)} Mo)…`);
    await download(modelUrl(model), file, MODELS[model].sha256, model);
  }
  console.log(`\nSynchronisation automatique prête (modèle ${model}). Relancez LANCER-STUDIO.bat si le studio est ouvert.`);
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
