import { describe, expect, it } from "vitest";
import { parseSilences } from "./ffmpeg";
import { SyncQueue } from "./sync-jobs";
import { hasRepetitionLoop, MODEL_PREFERENCE, MODELS, promptFor, soundRegions, speechBounds, speechStart, trimStart, wordsFromWhisperJson } from "./whisper";

describe("résultat de whisper-cli", () => {
  it("jetons DTW → mots, retard du modèle retiré, jetons collés réunis", () => {
    const json = {
      transcription: [
        {
          tokens: [
            { text: "[_BEG_]", t_dtw: -1 },
            { text: " Car", t_dtw: 120 },
            { text: " Dieu", t_dtw: 160 },
            { text: " a", t_dtw: 200 },
            { text: " tant", t_dtw: 230 },
            { text: " aim", t_dtw: 270 },
            { text: "é", t_dtw: 290 },
            { text: ",", t_dtw: 300 },
            { text: "[_TT_150]", t_dtw: 310 },
          ],
        },
      ],
    };
    const w = wordsFromWhisperJson(json, 0.2);
    expect(w.map((x) => x.text)).toEqual(["Car", "Dieu", "a", "tant", "aimé,"]);
    expect(w[0].start).toBeCloseTo(1.0, 5);
    expect(w[0].end).toBeCloseTo(1.4, 5); // début du mot suivant
    expect(w.at(-1)!.end).toBeCloseTo(2.5 + 0.6, 5); // dernier mot : 0,6 s au plus
  });
});

describe("silences", () => {
  const log = [
    "[silencedetect @ 0x1] silence_start: 0",
    "[silencedetect @ 0x1] silence_end: 1.52 | silence_duration: 1.52",
    "[silencedetect @ 0x1] silence_start: 20.3",
    "[silencedetect @ 0x1] silence_end: 21.1 | silence_duration: 0.8",
    "[silencedetect @ 0x1] silence_start: 58.4",
  ].join("\n");

  it("lecture du journal de ffmpeg, silence final jusqu'à la fin", () => {
    expect(parseSilences(log, 60)).toEqual([
      { start: 0, end: 1.52 },
      { start: 20.3, end: 21.1 },
      { start: 58.4, end: 60 },
    ]);
  });

  it("début et fin de la parole", () => {
    expect(speechBounds(parseSilences(log, 60), 60)).toEqual({ start: 1.52, end: 58.4 });
    expect(speechBounds([], 30)).toEqual({ start: 0, end: 30 });
  });

  it("un clic avant la parole (bouton d'enregistrement) n'est pas pris pour le début", () => {
    // Enregistrement réel : clic de 0,31 à 1,13 s, silence, parole à partir de 3,7 s.
    const silences = [
      { start: 0, end: 0.31 },
      { start: 1.13, end: 3.7 },
      { start: 75, end: 78.4 },
    ];
    const regions = soundRegions(silences, 78.4);
    expect(regions[0]).toEqual({ start: 0.31, end: 1.13 });
    expect(speechStart(regions, [4.11, 5.07])).toBe(3.7);
    expect(trimStart(speechStart(regions, [4.11]), 4.11)).toBe(3.45);
  });

  it("un titre court effectivement reconnu n'est jamais coupé", () => {
    const regions = soundRegions([{ start: 0, end: 1 }, { start: 1.6, end: 3 }], 60);
    // « Prière » (0,6 s) entendu à 1,1 s, puis silence, puis le texte à 3 s.
    expect(speechStart(regions, [1.1, 3.2])).toBe(1);
  });

  it("silence retiré : 0,25 s gardés, jamais au-delà du premier mot", () => {
    expect(trimStart(1.52, 1.6)).toBe(1.27);
    expect(trimStart(3, 1.2)).toBe(0.95);
    expect(trimStart(0.1, null)).toBe(0);
  });
});

describe("boucles de Whisper", () => {
  it("repère une phrase répétée en boucle (voix réelle, modèle medium)", () => {
    const loop = "C'est ce que nous devons faire, c'est ce que nous devons faire, c'est ce que nous devons faire, c'est ce que".split(" ");
    expect(hasRepetitionLoop(loop)).toBe(true);
  });
  it("un texte ordinaire, même avec des mots répétés, n'est pas une boucle", () => {
    const text = "Pa kite laperèz vòlè lapè ou. Pa kite reta fè ou panse Bondye bliye ou. Pa kite difikilte fè ou abandone.".split(" ");
    expect(hasRepetitionLoop(text)).toBe(false);
  });
});

describe("modèles", () => {
  it("chaque modèle a une empreinte SHA-256 et une taille", () => {
    for (const id of MODEL_PREFERENCE) {
      expect(MODELS[id].sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(MODELS[id].bytes).toBeGreaterThan(1e7);
    }
  });
  it("invite : début du texte, sans guillemets ni espaces insécables", () => {
    expect(promptFor(["« Sentez", "et", "voyez »"])).toBe("Sentez et voyez");
  });
});

describe("file des synchronisations", () => {
  const result = { words: [], confidence: 1, trimStartSeconds: 0, model: "tiny" as const, recognizedText: "", seconds: 1 };

  it("une à la fois, dans l'ordre, avec la progression", async () => {
    const order: string[] = [];
    const q = new SyncQueue(async ({ chemin, onProgress }) => {
      order.push(chemin);
      onProgress(0.5);
      await new Promise((r) => setTimeout(r, 5));
      return result;
    }, () => "tiny");
    const a = q.add("VoixOff/a.m4a", ["un"], "fr");
    const b = q.add("VoixOff/b.m4a", ["deux"], "ht");
    expect(q.get(b.id)!.statut).toBe("en-attente");
    await new Promise((r) => setTimeout(r, 50));
    expect(order).toEqual(["VoixOff/a.m4a", "VoixOff/b.m4a"]);
    expect(q.get(a.id)!.statut).toBe("termine");
    expect(q.get(a.id)!.progression).toBe(1);
  });

  it("échec clair si Whisper n'est pas installé", async () => {
    const q = new SyncQueue(async () => result, () => null);
    const j = q.add("VoixOff/a.m4a", ["un"], "fr");
    await new Promise((r) => setTimeout(r, 10));
    expect(q.get(j.id)!.statut).toBe("echec");
    expect(q.get(j.id)!.message).toMatch(/INSTALLER-WHISPER/);
  });

  it("annulation pendant l'analyse", async () => {
    const q = new SyncQueue(
      ({ signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("annulée")))),
      () => "tiny",
    );
    const j = q.add("VoixOff/a.m4a", ["un"], "fr");
    await new Promise((r) => setTimeout(r, 5));
    q.cancel(j.id);
    await new Promise((r) => setTimeout(r, 5));
    expect(q.get(j.id)!.statut).toBe("annule");
  });
});
