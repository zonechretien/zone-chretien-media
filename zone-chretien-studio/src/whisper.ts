/**
 * Synchronisation du texte sur la voix off avec whisper.cpp, hors ligne, sur
 * le PC : aucun droit administrateur, aucune installation dans Windows.
 * L'exécutable et le modèle sont rangés dans zone-chretien-studio/.whisper/
 * (non versionné, exclu de Vercel), installés par `npm run whisper`.
 *
 * Whisper ne sert qu'au minutage : le texte affiché reste celui de l'éditeur
 * (alignement dans remotion/lib/sync/align.ts).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { alignScript, type Alignment, type RecognizedWord } from "../../remotion/lib/sync/align";
import type { SyncLanguage } from "../../remotion/lib/sync/numbers";
import { convertToWav16k, detectSilences, probeDuration, type Silence } from "./ffmpeg";
import { STUDIO_DIR } from "./paths";

/** whisper.cpp v1.9.4 : exécutables Windows publiés sous l'étiquette b5130 (même commit 927cfce). */
export const WHISPER_BUILD = {
  version: "1.9.4",
  url: "https://github.com/ggml-org/whisper.cpp/releases/download/b5130/whisper-bin-x64.zip",
  sha256: "f9ec6c52a2e949b62ab51fa21d0d497958f9e41c3010c157c4e42932d5316f3c",
};

export type ModelId = "tiny" | "small" | "medium" | "large-v3-turbo";

/**
 * Modèles multilingues (français et créole haïtien). `offsetSeconds` : retard
 * systématique des instants DTW de whisper.cpp sur le début réel des mots,
 * mesuré sur une voix de référence minutée (voir README, § Synchronisation).
 */
export const MODELS: Record<ModelId, { bytes: number; sha256: string; dtw: string; offsetSeconds: number }> = {
  tiny: { bytes: 77_691_713, sha256: "be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21", dtw: "tiny", offsetSeconds: 0.33 },
  small: { bytes: 487_601_967, sha256: "1be3a9b2063867b937e64e2ec7483364a79917e157fa98c5d94b5c1fffea987b", dtw: "small", offsetSeconds: 0.21 },
  medium: { bytes: 1_533_763_059, sha256: "6c14d5adee5f86394037b4e4e8b59f1673b6cee10e3cf0b11bbdbee79c156208", dtw: "medium", offsetSeconds: 0.34 },
  "large-v3-turbo": { bytes: 1_624_555_275, sha256: "1fc70f774d38eb169993ac391eea357ef47c88757ef72ee5943879b7e8e2bc69", dtw: "large.v3.turbo", offsetSeconds: 0.22 },
};
/** Ordre de préférence quand plusieurs modèles sont présents. */
export const MODEL_PREFERENCE: ModelId[] = ["large-v3-turbo", "medium", "small", "tiny"];

export const WHISPER_DIR = path.join(STUDIO_DIR, ".whisper");
export const WHISPER_EXE = path.join(WHISPER_DIR, `bin-${WHISPER_BUILD.version}`, "Release", "whisper-cli.exe");
export const modelFile = (id: ModelId) => path.join(WHISPER_DIR, "modeles", `ggml-${id}.bin`);
export const modelUrl = (id: ModelId) => `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${id}.bin`;

export type WhisperState = { etat: "pret"; modele: ModelId } | { etat: "absent"; message: string };

/** Modèle utilisable (taille vérifiée ; l'empreinte l'a été à l'installation). */
export function whisperState(preferred?: string): WhisperState {
  if (!fs.existsSync(WHISPER_EXE)) return { etat: "absent", message: "Synchronisation automatique non installée : lancez INSTALLER-WHISPER.bat (une seule fois, connexion Internet requise)." };
  const order = MODEL_PREFERENCE.includes(preferred as ModelId) ? [preferred as ModelId, ...MODEL_PREFERENCE] : MODEL_PREFERENCE;
  for (const id of order) {
    try {
      if (fs.statSync(modelFile(id)).size === MODELS[id].bytes) return { etat: "pret", modele: id };
    } catch {
      // modèle absent : suivant
    }
  }
  return { etat: "absent", message: "Aucun modèle Whisper installé : lancez INSTALLER-WHISPER.bat." };
}

// ---------------------------------------------------------------------------
// Lecture du résultat de whisper-cli (logique pure, testée)
// ---------------------------------------------------------------------------

type WhisperToken = { text: string; t_dtw?: number };
export type WhisperJson = { transcription: { tokens?: WhisperToken[] }[] };

/**
 * Jetons DTW → mots avec leur instant de début (retard du modèle retiré).
 * Un jeton sans espace initial prolonge le mot précédent (« beg » + « otten »).
 * Fin d'un mot : début du suivant, au plus 0,6 s après son début.
 */
export function wordsFromWhisperJson(json: WhisperJson, offsetSeconds: number): RecognizedWord[] {
  const words: RecognizedWord[] = [];
  for (const seg of json.transcription ?? []) {
    for (const t of seg.tokens ?? []) {
      if (t.text.startsWith("[_") || t.text.startsWith("<|") || typeof t.t_dtw !== "number" || t.t_dtw < 0) continue;
      const at = Math.max(0, t.t_dtw / 100 - offsetSeconds);
      // Suite d'un mot ou ponctuation : pas d'espace initial.
      const glued = !t.text.startsWith(" ") && words.length > 0;
      if (glued) words[words.length - 1].text += t.text;
      else if (t.text.trim()) words.push({ text: t.text.trim(), start: at, end: at });
    }
  }
  words.forEach((w, i) => {
    const next = words[i + 1]?.start ?? w.start + 0.6;
    w.end = Math.max(w.start + 0.05, Math.min(w.start + 0.6, next));
  });
  return words;
}

/** Début et fin de la parole d'après les silences (tout le fichier si aucun silence au bord). */
export function speechBounds(silences: Silence[], durationSeconds: number): { start: number; end: number } {
  const lead = silences.find((s) => s.start <= 0.05);
  const tail = silences.find((s) => s.end >= durationSeconds - 0.05 && s.start > (lead?.end ?? 0));
  return { start: lead?.end ?? 0, end: tail?.start ?? durationSeconds };
}

/** Silence retiré au début : on garde 0,25 s avant la parole, et jamais au-delà du premier mot reconnu. */
export function trimStart(speechStart: number, firstWord: number | null): number {
  const keep = 0.25;
  const bound = firstWord === null ? speechStart : Math.min(speechStart, firstWord);
  return Math.max(0, Math.round((bound - keep) * 100) / 100);
}

/** Invite donnée à Whisper : le début du texte attendu (orthographe, noms propres). */
export function promptFor(script: string[]): string {
  return script.slice(0, 80).join(" ").replace(/[«»  ]/g, " ").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

export type SyncResult = Alignment & { trimStartSeconds: number; model: ModelId; recognizedText: string; seconds: number };

function runWhisper(args: string[], onProgress: (p: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(WHISPER_EXE, args, { cwd: path.dirname(WHISPER_EXE), windowsHide: true });
    let err = "";
    const abort = () => child.kill();
    signal.addEventListener("abort", abort, { once: true });
    child.stderr.on("data", (d: Buffer) => {
      const s = d.toString();
      err = (err + s).slice(-4000);
      for (const m of s.matchAll(/progress\s*=\s*(\d+)%/g)) onProgress(Number(m[1]) / 100);
    });
    child.stdout.on("data", () => undefined);
    child.on("error", (e) => reject(new Error(`Whisper n'a pas pu démarrer : ${e.message}`)));
    child.on("close", (code) => {
      signal.removeEventListener("abort", abort);
      if (signal.aborted) reject(new Error("Synchronisation annulée."));
      else if (code === 0) resolve();
      else reject(new Error(`Whisper a échoué (code ${code}) : ${err.trim().split("\n").pop() ?? ""}`));
    });
  });
}

/** Analyse la voix off et aligne le texte exact sur elle. */
export async function synchronize(o: {
  file: string;
  script: string[];
  language: SyncLanguage;
  model: ModelId;
  onProgress: (p: number) => void;
  signal: AbortSignal;
}): Promise<SyncResult> {
  const t0 = Date.now();
  // Fichiers intermédiaires dans le dossier temporaire de Windows : jamais dans le dépôt ni la bibliothèque.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zc-whisper-"));
  try {
    const wav = path.join(tmp, "voix.wav");
    await convertToWav16k(o.file, wav);
    const duration = (await probeDuration(wav)) ?? 0;
    const speech = speechBounds(await detectSilences(wav, duration), duration);

    const m = MODELS[o.model];
    const threads = String(Math.max(2, Math.min(8, os.cpus().length - 2)));
    const outBase = path.join(tmp, "resultat");
    const args = ["-m", modelFile(o.model), "-f", wav, "-l", o.language, "-ojf", "-of", outBase, "-t", threads, "-pp", "-nfa", "--dtw", m.dtw];
    const prompt = promptFor(o.script);
    if (prompt) args.push("--prompt", prompt);
    await runWhisper(args, o.onProgress, o.signal);

    const json = JSON.parse(fs.readFileSync(`${outBase}.json`, "utf8")) as WhisperJson;
    const recognized = wordsFromWhisperJson(json, m.offsetSeconds);
    const alignment = alignScript(o.script, recognized, { language: o.language, speech });
    const firstAnchor = alignment.words.find((w) => w.match > 0)?.start ?? null;
    return {
      ...alignment,
      trimStartSeconds: trimStart(speech.start, firstAnchor),
      model: o.model,
      recognizedText: recognized.map((w) => w.text).join(" "),
      seconds: Math.round((Date.now() - t0) / 100) / 10,
    };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
