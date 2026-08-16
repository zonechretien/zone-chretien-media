import { defineConfig } from "prisma/config";

// Prisma 7 : l'URL de connexion utilisée par Prisma Migrate (CLI) vit ici,
// séparément du client runtime (voir src/lib/db.ts qui utilise l'adapter
// libSQL avec TURSO_DATABASE_URL / TURSO_AUTH_TOKEN).
//
// - Dev local : TURSO_DATABASE_URL="file:./prisma/dev.db" → `prisma migrate dev`
//   fonctionne directement contre ce fichier local.
// - Turso distant : le moteur de migration de Prisma ne pilote pas encore les
//   bases libSQL distantes nativement. Le flux recommandé (voir README) est de
//   générer les migrations en local puis de les appliquer à Turso via
//   `turso db shell <db> < prisma/migrations/<horodatage>_<nom>/migration.sql`
//   (ou en collant le SQL dans dashboard.turso.tech).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  },
  migrations: {
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
});
