import { describe, expect, it } from "vitest";
import { versetSchema, type VersetProps } from "./schemas";

const valid: VersetProps = {
  format: "9:16",
  background: { type: "gradient", from: "#16335F", to: "#050E1F" },
  durationSeconds: null,
  kicker: "Parole du jour",
  reference: "Psaume 34:8",
  text: "Sentez et voyez combien l'Éternel est bon!",
  showVersion: true,
  music: null,
  voiceOver: null,
  language: "fr",
};

describe("versetSchema", () => {
  it("accepte des props valides", () => {
    expect(versetSchema.safeParse(valid).success).toBe(true);
  });

  it("accepte un fond image avec un chemin relatif", () => {
    const r = versetSchema.safeParse({ ...valid, background: { type: "image", path: "Fonds/ciel.jpg", dim: 0.4 } });
    expect(r.success).toBe(true);
  });

  it.each([
    ["référence vide", { reference: "  " }],
    ["texte vide", { text: "" }],
    ["format inconnu", { format: "4:5" }],
    ["couleur invalide", { background: { type: "color", color: "bleu" } }],
    ["chemin absolu", { background: { type: "image", path: "E:/Fonds/ciel.jpg", dim: 0.4 } }],
    ["traversée de chemin", { background: { type: "video", path: "../../secret.mp4", dim: 0.4, mediaDurationSeconds: 4 } }],
    ["durée trop courte", { durationSeconds: 2 }],
  ])("refuse : %s", (_label, patch) => {
    expect(versetSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("fond vidéo", () => {
  it("accepte une durée connue ou inconnue (null)", () => {
    for (const d of [4.2, null]) {
      const bg = { type: "video", path: "Fonds/nuages.mp4", dim: 0.3, mediaDurationSeconds: d };
      expect(versetSchema.safeParse({ ...valid, background: bg }).success).toBe(true);
    }
  });
});

describe("audio (étape 6)", () => {
  it("un projet enregistré avant l'audio reste valide (musique et voix off à null)", () => {
    const old: Record<string, unknown> = { ...valid };
    delete old.music;
    delete old.voiceOver;
    const r = versetSchema.safeParse(old);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ music: null, voiceOver: null });
  });

  it("accepte une musique et une voix off valides", () => {
    const r = versetSchema.safeParse({
      ...valid,
      music: { path: "Musiques/douce.mp3", volume: 0.6, fadeInSeconds: 1, fadeOutSeconds: 2 },
      voiceOver: { path: "VoixOff/voix.webm", volume: 1, startSeconds: 0.5, mediaDurationSeconds: 5.2, musicDuckVolume: 0.25, fitDuration: true },
    });
    expect(r.success).toBe(true);
  });

  it("refuse une musique sans fichier ou avec un chemin dangereux", () => {
    expect(versetSchema.safeParse({ ...valid, music: { path: "", volume: 0.6, fadeInSeconds: 1, fadeOutSeconds: 2 } }).success).toBe(false);
    expect(versetSchema.safeParse({ ...valid, music: { path: "../x.mp3", volume: 0.6, fadeInSeconds: 1, fadeOutSeconds: 2 } }).success).toBe(false);
  });
});
