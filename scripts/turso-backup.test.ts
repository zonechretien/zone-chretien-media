import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEVEN_ZIP } from "./backup-crypto";
import { secureUnverifiedBackup, unverifiedName } from "./turso-backup";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "zc-sauvegarde-"));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

const sqlFiles = () => fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".sql"));

function backup(name = "zone-chretien-media_2026-09-24_10-00.sql"): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, "CREATE TABLE t (x);\nINSERT INTO t VALUES ('données');\n");
  return file;
}

describe("unverifiedName", () => {
  it("ajoute _NON-VERIFIEE avant l'extension", () => {
    expect(path.basename(unverifiedName(path.join(dir, "base_2026-09-24_10-00.sql")))).toBe("base_2026-09-24_10-00_NON-VERIFIEE.sql");
  });

  it("n'écrase ni un .sql ni une archive .7z déjà présents", () => {
    fs.writeFileSync(path.join(dir, "base_NON-VERIFIEE.7z"), "");
    fs.writeFileSync(path.join(dir, "base_NON-VERIFIEE-2.sql"), "");
    expect(path.basename(unverifiedName(path.join(dir, "base.sql")))).toBe("base_NON-VERIFIEE-3.sql");
  });
});

describe("secureUnverifiedBackup", () => {
  it("supprime le .sql si le chiffrement est impossible (mot de passe non saisi)", async () => {
    const file = backup();
    const result = await secureUnverifiedBackup(file, () => Promise.reject(new Error("Saisie annulée (Ctrl+C).")));
    expect(result).toBeNull();
    expect(sqlFiles()).toEqual([]);
  });

  it.skipIf(!fs.existsSync(SEVEN_ZIP))("chiffre la sauvegarde sous un nom _NON-VERIFIEE et ne laisse aucun .sql", async () => {
    const file = backup();
    const archive = await secureUnverifiedBackup(file, () => Promise.resolve("mot-de-passe-de-test-123"));
    expect(archive && path.basename(archive)).toBe("zone-chretien-media_2026-09-24_10-00_NON-VERIFIEE.7z");
    expect(fs.existsSync(archive!)).toBe(true);
    expect(sqlFiles()).toEqual([]);
  });
});
