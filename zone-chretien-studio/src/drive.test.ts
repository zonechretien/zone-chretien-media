import nodeFs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARKER_FILE, candidateLibraries, detectLibrary, windowsDriveRoots, type DriveFs } from "./drive";

const MARKER = JSON.stringify({ application: "com.lepolo.zc-studio", nom: "Bibliothèque Zone-Chrétien", version: 1 });
const FOLDER = "Zone-Chretien-Studio";
const lib = (drive: string) => path.join(drive, FOLDER);

/** Faux disque : fichiers (contenu) et vrais dossiers ; tout dossier non listé est absent ou un lien. */
function fakeFs(files: Record<string, string>, dirs: string[] = Object.keys(files).map((f) => path.dirname(f))): DriveFs {
  return {
    exists: (p) => p in files,
    readText: (p) => {
      if (!(p in files)) throw new Error("ENOENT");
      return files[p];
    },
    isRealDirectory: (p) => dirs.includes(p),
  };
}

describe("windowsDriveRoots", () => {
  it("liste C: à Z:", () => {
    const roots = windowsDriveRoots();
    expect(roots[0]).toBe("C:\\");
    expect(roots.at(-1)).toBe("Z:\\");
    expect(roots).toHaveLength(24);
  });
});

describe("candidateLibraries", () => {
  it("cherche le dossier dédié, d'abord sur le disque du studio, puis sur chaque lettre", () => {
    const c = candidateLibraries({ studioDir: "G:\\zone-chretien\\zone-chretien-studio", platform: "win32", folderName: FOLDER });
    expect(c[0]).toBe(lib("G:\\"));
    expect(c.filter((r) => r === lib("G:\\"))).toHaveLength(1);
    expect(c).toContain(lib("D:\\"));
    expect(c).toHaveLength(24);
    expect(c.every((r) => r.endsWith(`\\${FOLDER}`))).toBe(true);
  });

  it("respecte le nom de dossier configuré", () => {
    const c = candidateLibraries({ studioDir: "C:\\x", platform: "win32", folderName: "Mes-Reels" });
    expect(c[0]).toBe(path.join("C:\\", "Mes-Reels"));
  });

  it("utilise uniquement le dossier forcé quand il est fourni", () => {
    const c = candidateLibraries({ override: "D:\\test-bibliotheque", studioDir: "C:\\x", platform: "win32", folderName: FOLDER });
    expect(c).toEqual([path.resolve("D:\\test-bibliotheque")]);
  });
});

describe("detectLibrary", () => {
  it("trouve le dossier portant le repère, quelle que soit la lettre du disque", () => {
    const fs = fakeFs({ [path.join(lib("F:\\"), MARKER_FILE)]: MARKER });
    const found = detectLibrary(["C:\\", "E:\\", "F:\\"].map(lib), fs);
    expect(found?.root).toBe(lib("F:\\"));
    expect(found?.marker.nom).toBe("Bibliothèque Zone-Chrétien");
  });

  it("ignore un repère posé à la racine du disque (ancienne organisation)", () => {
    const fs = fakeFs({ [path.join("D:\\", MARKER_FILE)]: MARKER });
    expect(detectLibrary(["C:\\", "D:\\"].map(lib), fs)).toBeNull();
  });

  it("renvoie null si aucun disque n'est branché", () => {
    expect(detectLibrary(["C:\\", "D:\\"].map(lib), fakeFs({}))).toBeNull();
  });

  it("ignore un dossier de bibliothèque qui est un lien symbolique ou une jonction", () => {
    const fs = fakeFs({ [path.join(lib("E:\\"), MARKER_FILE)]: MARKER, [path.join(lib("H:\\"), MARKER_FILE)]: MARKER }, [lib("H:\\")]);
    expect(detectLibrary(["E:\\", "H:\\"].map(lib), fs)?.root).toBe(lib("H:\\"));
  });

  it("ignore un repère illisible ou d'une autre application et continue", () => {
    const fs = fakeFs({
      [path.join(lib("E:\\"), MARKER_FILE)]: "{ pas du json",
      [path.join(lib("F:\\"), MARKER_FILE)]: JSON.stringify({ application: "autre.app", nom: "x", version: 1 }),
      [path.join(lib("H:\\"), MARKER_FILE)]: MARKER,
    });
    expect(detectLibrary(["E:\\", "F:\\", "H:\\"].map(lib), fs)?.root).toBe(lib("H:\\"));
  });
});

describe("detectLibrary sur un vrai système de fichiers", () => {
  it("trouve le vrai dossier et ignore une jonction portant le même nom", () => {
    const base = nodeFs.mkdtempSync(path.join(os.tmpdir(), "zc-drive-"));
    try {
      const vrai = path.join(base, "lecteur-1", FOLDER);
      nodeFs.mkdirSync(vrai, { recursive: true });
      nodeFs.writeFileSync(path.join(vrai, MARKER_FILE), MARKER);
      nodeFs.mkdirSync(path.join(base, "lecteur-2"));
      const jonction = path.join(base, "lecteur-2", FOLDER);
      nodeFs.symlinkSync(vrai, jonction, "junction");

      expect(detectLibrary([jonction])).toBeNull();
      expect(detectLibrary([jonction, vrai])?.root).toBe(vrai);
    } finally {
      nodeFs.rmSync(base, { recursive: true, force: true });
    }
  });
});
