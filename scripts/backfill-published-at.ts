/**
 * Rattrape les lignes où `publishedAt` est vide (contenu importé/seedé avant
 * l'ajout de ce champ) en le calant sur `createdAt`, pour que le tri par
 * date de publication soit fiable partout (voir requête "tri des listes").
 * Usage : npm run backfill:published-at
 */
import { prisma } from "../src/lib/db";

const TABLES = [
  "songs",
  "playlists",
  "videos",
  "inspirations",
  "prayers",
  "testimonies",
  "articles",
  "resources",
] as const;

async function main() {
  for (const table of TABLES) {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL`,
    );
    console.log(`${table}: ${result} ligne(s) mise(s) à jour`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
