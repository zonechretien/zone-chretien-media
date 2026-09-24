import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { isValidFolderName, loadConfig } from "./config";

const dirs: string[] = [];
function studioDir(config: object, local?: object): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zc-config-"));
  dirs.push(dir);
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(config));
  if (local) fs.writeFileSync(path.join(dir, "config.local.json"), JSON.stringify(local));
  return dir;
}
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

const BASE = { port: 4317, dossierBibliotheque: "Zone-Chretien-Studio", originesAutorisees: ["https://zone-chretien.org"] };

describe("isValidFolderName", () => {
  it("accepte un simple nom de dossier", () => {
    expect(isValidFolderName("Zone-Chretien-Studio")).toBe(true);
    expect(isValidFolderName("Reels Zone Chrétien")).toBe(true);
  });

  it("refuse chemins, lettres de lecteur, remontées et dossiers cachés", () => {
    for (const bad of ["", "..", ".", "a\\b", "a/b", "C:", "C:\\x", "x\\..\\..\\Windows", "../x", ".cache", "x.", " x", "a*b", "a?b"]) {
      expect(isValidFolderName(bad), bad).toBe(false);
    }
  });
});

describe("loadConfig", () => {
  it("lit le dossier de la bibliothèque dans config.json", () => {
    expect(loadConfig(studioDir(BASE)).dossierBibliotheque).toBe("Zone-Chretien-Studio");
  });

  it("config.local.json peut changer le dossier et ajouter des origines", () => {
    const c = loadConfig(studioDir(BASE, { dossierBibliotheque: "Mes-Reels", originesAutorisees: ["https://preview.example.com"] }));
    expect(c.dossierBibliotheque).toBe("Mes-Reels");
    expect(c.originesAutorisees).toEqual(["https://zone-chretien.org", "https://preview.example.com"]);
    expect(c.port).toBe(4317);
  });

  it("refuse un dossier qui n'est pas un simple nom", () => {
    expect(() => loadConfig(studioDir(BASE, { dossierBibliotheque: "..\\Windows" }))).toThrow();
  });

  it("config.local.json peut autoriser le serveur de développement local", () => {
    const c = loadConfig(studioDir(BASE, { originesAutorisees: ["http://localhost:3000"] }));
    expect(c.originesAutorisees).toEqual(["https://zone-chretien.org", "http://localhost:3000"]);
  });
});

describe("config.json versionné", () => {
  // Les origines de développement (http://localhost:…) vont dans config.local.json, jamais ici.
  it("n'autorise que les sites HTTPS du CMS", () => {
    const shipped = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json"), "utf8")) as { originesAutorisees: string[] };
    expect(shipped.originesAutorisees.length).toBeGreaterThan(0);
    for (const origin of shipped.originesAutorisees) expect(new URL(origin).protocol, origin).toBe("https:");
  });
});
