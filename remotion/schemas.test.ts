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
    ["traversée de chemin", { background: { type: "video", path: "../../secret.mp4", dim: 0.4 } }],
    ["durée trop courte", { durationSeconds: 2 }],
  ])("refuse : %s", (_label, patch) => {
    expect(versetSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});
