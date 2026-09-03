import { Prisma } from "@prisma/client";

/**
 * Détecte une violation de contrainte unique (slug déjà utilisé, etc.) de façon
 * fiable même avec l'adapter Turso/libsql (@prisma/adapter-libsql) : contrairement
 * au moteur Prisma standard, cet adapter ne traduit pas les erreurs SQLite vers les
 * codes documentés — un SQLITE_CONSTRAINT remonte sous un code générique (observé :
 * P2039, y compris pour d'autres erreurs SQLite comme une table manquante), donc
 * `err.code === "P2002"` seul ne matche jamais en production et laisse planter la
 * page avec une 500 au lieu du message convivial. On vérifie donc aussi le message
 * brut de l'erreur.
 */
export function isUniqueConstraintError(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code === "P2002") return true;
  return typeof err.message === "string" && err.message.includes("UNIQUE constraint failed");
}
