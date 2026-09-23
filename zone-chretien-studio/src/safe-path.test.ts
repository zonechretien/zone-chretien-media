import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MediaNotFoundError, UnsafePathError, isInside, isSafeRelativePath, resolveLibraryFile, toRelative } from "./safe-path";

let base: string;
let root: string;

beforeAll(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), "zc-safe-path-"));
  // base = le disque, root = le dossier dédié de la bibliothèque à sa racine.
  root = path.join(base, "Zone-Chretien-Studio");
  fs.mkdirSync(path.join(root, "Musiques", "Calme"), { recursive: true });
  fs.writeFileSync(path.join(root, "Musiques", "Calme", "douce.mp3"), "x");
  fs.mkdirSync(path.join(root, ".zc-cache"));
  fs.writeFileSync(path.join(root, ".zc-cache", "a.jpg"), "x");
  fs.mkdirSync(path.join(base, "secret"));
  fs.writeFileSync(path.join(base, "secret", "motdepasse.txt"), "x");
  fs.writeFileSync(path.join(base, "disque-voisin.txt"), "x");
  fs.mkdirSync(path.join(base, "Documents personnels"));
  fs.writeFileSync(path.join(base, "Documents personnels", "lettre.docx"), "x");
  // Jonction Windows (pas besoin de droits administrateur) qui pointe hors de la bibliothèque.
  fs.symlinkSync(path.join(base, "secret"), path.join(root, "Musiques", "lien"), "junction");
  fs.symlinkSync(base, path.join(root, "Fonds-disque"), "junction");
});

afterAll(() => fs.rmSync(base, { recursive: true, force: true }));

describe("isSafeRelativePath", () => {
  it.each(["Musiques/a.mp3", "Fonds/sous dossier/b.jpg"])("accepte %s", (p) => expect(isSafeRelativePath(p)).toBe(true));
  it.each(["", "../a", "a/../../b", "/a", "C:/a", "C:a", "a\\b", "https://x/a", "a//b", "./a", ".zc-cache/a.jpg", "a\0b"])(
    "refuse %j",
    (p) => expect(isSafeRelativePath(p)).toBe(false),
  );
});

describe("isInside", () => {
  it("détecte un préfixe trompeur (disque-voisin n'est pas dans disque)", () => {
    expect(isInside("C:\\disque", "C:\\disque-voisin\\a")).toBe(false);
    expect(isInside("C:\\disque", "C:\\disque\\a")).toBe(true);
  });
});

describe("resolveLibraryFile", () => {
  it("résout un fichier existant de la bibliothèque", () => {
    const abs = resolveLibraryFile(root, "Musiques/Calme/douce.mp3");
    expect(toRelative(fs.realpathSync.native(root), abs)).toBe("Musiques/Calme/douce.mp3");
  });

  it("refuse la traversée de chemin", () => {
    expect(() => resolveLibraryFile(root, "../secret/motdepasse.txt")).toThrow(UnsafePathError);
    expect(() => resolveLibraryFile(root, "Musiques/../../disque-voisin.txt")).toThrow(UnsafePathError);
  });

  it("ne lit jamais les autres fichiers du disque, hors du dossier de la bibliothèque", () => {
    expect(() => resolveLibraryFile(root, "../Documents personnels/lettre.docx")).toThrow(UnsafePathError);
    expect(() => resolveLibraryFile(root, "Fonds-disque/Documents personnels/lettre.docx")).toThrow(UnsafePathError);
    expect(() => resolveLibraryFile(root, "Fonds-disque/disque-voisin.txt")).toThrow(UnsafePathError);
  });

  it("refuse un chemin absolu", () => {
    expect(() => resolveLibraryFile(root, path.join(base, "secret", "motdepasse.txt"))).toThrow(UnsafePathError);
  });

  it("refuse une jonction / un lien qui sort de la bibliothèque", () => {
    expect(() => resolveLibraryFile(root, "Musiques/lien/motdepasse.txt")).toThrow(UnsafePathError);
  });

  it("refuse le cache caché", () => {
    expect(() => resolveLibraryFile(root, ".zc-cache/a.jpg")).toThrow(UnsafePathError);
  });

  it("signale un média introuvable", () => {
    expect(() => resolveLibraryFile(root, "Musiques/absente.mp3")).toThrow(MediaNotFoundError);
  });

  it("refuse un dossier à la place d'un fichier", () => {
    expect(() => resolveLibraryFile(root, "Musiques/Calme")).toThrow(MediaNotFoundError);
  });
});
