import { describe, expect, it } from "vitest";
import { isSafeRelativeMediaPath, mediaUrl } from "./media-path";

describe("isSafeRelativeMediaPath", () => {
  it.each(["Musiques/adoration-douce.mp3", "Fonds/lever de soleil.jpg", "Logos/zc.png", "a.mp3"])(
    "accepte le chemin relatif %s",
    (p) => expect(isSafeRelativeMediaPath(p)).toBe(true),
  );

  it.each([
    ["vide", ""],
    ["remontée", "../secret.txt"],
    ["remontée au milieu", "Musiques/../../Windows/win.ini"],
    ["segment .", "Musiques/./a.mp3"],
    ["absolu Unix", "/etc/passwd"],
    ["lettre de lecteur", "C:/Windows/win.ini"],
    ["lettre de lecteur sans barre", "E:Musiques/a.mp3"],
    ["antislash Windows", "Musiques\\a.mp3"],
    ["chemin UNC", "\\\\serveur\\partage"],
    ["URL", "https://exemple.com/a.mp3"],
    ["URL file", "file:///C:/a.mp3"],
    ["double barre", "Musiques//a.mp3"],
    ["barre finale", "Musiques/"],
    ["octet nul", "a.mp3\0.txt"],
  ])("refuse : %s", (_label, p) => expect(isSafeRelativeMediaPath(p)).toBe(false));

  it("refuse les chemins trop longs", () => {
    expect(isSafeRelativeMediaPath("a/".repeat(200) + "b.mp3")).toBe(false);
  });
});

describe("mediaUrl", () => {
  it("encode chaque segment et ajoute la barre manquante", () => {
    expect(mediaUrl("Fonds/lever de soleil.jpg", "http://127.0.0.1:4317/media")).toBe(
      "http://127.0.0.1:4317/media/Fonds/lever%20de%20soleil.jpg",
    );
  });

  it("renvoie null sans studio ou pour un chemin dangereux", () => {
    expect(mediaUrl("Fonds/a.jpg", undefined)).toBeNull();
    expect(mediaUrl("../a.jpg", "http://127.0.0.1:4317/media/")).toBeNull();
  });
});
