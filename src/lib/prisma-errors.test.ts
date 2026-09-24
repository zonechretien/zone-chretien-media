import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isUniqueConstraintError } from "./prisma-errors";

const known = (message: string, code: string) => new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: "test" });

describe("isUniqueConstraintError", () => {
  it("reconnaît P2002 (moteur standard, base fichier locale)", () => {
    expect(isUniqueConstraintError(known("Unique constraint failed on the fields: (`date`)", "P2002"))).toBe(true);
  });

  it("reconnaît l'erreur de Turso distant, remontée en P2039 par l'adapter libSQL", () => {
    // Message exact observé au build Vercel sur /bible (verset du jour créé en parallèle).
    const err = known("Database error. Code: `N/A`. Message: `SQLITE_CONSTRAINT: SQLite error: UNIQUE constraint failed: verses.date`", "P2039");
    expect(isUniqueConstraintError(err)).toBe(true);
  });

  it("ne confond pas avec une autre erreur SQLite en P2039", () => {
    expect(isUniqueConstraintError(known("Database error. Code: `1`. Message: `SQLITE_ERROR: no such table: main.songs`", "P2039"))).toBe(false);
  });

  it("ignore les erreurs qui ne viennent pas de Prisma", () => {
    expect(isUniqueConstraintError(new Error("UNIQUE constraint failed: verses.date"))).toBe(false);
    expect(isUniqueConstraintError(null)).toBe(false);
  });
});
