import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARKER_FILE, candidateRoots, detectLibrary, windowsDriveRoots, type DriveFs } from "./drive";

const MARKER = JSON.stringify({ application: "com.lepolo.zc-studio", nom: "Bibliothèque Zone-Chrétien", version: 1 });

function fakeFs(files: Record<string, string>): DriveFs {
  return {
    exists: (p) => p in files,
    readText: (p) => {
      if (!(p in files)) throw new Error("ENOENT");
      return files[p];
    },
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

describe("candidateRoots", () => {
  it("cherche d'abord sur le disque du studio", () => {
    const roots = candidateRoots({ studioDir: "G:\\zone-chretien\\zone-chretien-studio", platform: "win32" });
    expect(roots[0]).toBe("G:\\");
    expect(roots.filter((r) => r === "G:\\")).toHaveLength(1);
  });

  it("utilise uniquement le dossier forcé quand il est fourni", () => {
    const roots = candidateRoots({ override: "D:\\test-bibliotheque", studioDir: "C:\\x", platform: "win32" });
    expect(roots).toEqual([path.resolve("D:\\test-bibliotheque")]);
  });
});

describe("detectLibrary", () => {
  it("trouve le disque portant le repère, quelle que soit sa lettre", () => {
    const fs = fakeFs({ [path.join("F:\\", MARKER_FILE)]: MARKER });
    const lib = detectLibrary(["C:\\", "E:\\", "F:\\", "G:\\"], fs);
    expect(lib?.root).toBe("F:\\");
    expect(lib?.marker.nom).toBe("Bibliothèque Zone-Chrétien");
  });

  it("renvoie null si aucun disque n'est branché", () => {
    expect(detectLibrary(["C:\\", "D:\\"], fakeFs({}))).toBeNull();
  });

  it("ignore un repère illisible ou d'une autre application et continue", () => {
    const fs = fakeFs({
      [path.join("E:\\", MARKER_FILE)]: "{ pas du json",
      [path.join("F:\\", MARKER_FILE)]: JSON.stringify({ application: "autre.app", nom: "x", version: 1 }),
      [path.join("H:\\", MARKER_FILE)]: MARKER,
    });
    expect(detectLibrary(["E:\\", "F:\\", "H:\\"], fs)?.root).toBe("H:\\");
  });
});
