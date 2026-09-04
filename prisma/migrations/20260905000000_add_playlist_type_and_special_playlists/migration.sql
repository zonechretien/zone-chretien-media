-- AlterTable
ALTER TABLE "playlists" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'EDITORIALE';

-- Playlists spéciales générées automatiquement (contenu calculé dynamiquement,
-- jamais d'entrées dans playlist_songs) — insertion idempotente.
INSERT INTO "playlists" ("id", "title", "slug", "description", "type", "order", "published", "createdAt", "updatedAt")
SELECT 'top10-semaine-auto', 'Top 10 de la semaine', 'top-10-semaine',
       'Les chansons les plus écoutées de Zone-Chrétien Media au cours des 7 derniers jours — mis à jour automatiquement.',
       'TOP_SEMAINE', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "playlists" WHERE "type" = 'TOP_SEMAINE');

INSERT INTO "playlists" ("id", "title", "slug", "description", "type", "order", "published", "createdAt", "updatedAt")
SELECT 'top10-toujours-auto', 'Top 10 depuis toujours', 'top-10-depuis-toujours',
       'Les chansons les plus écoutées de Zone-Chrétien Media depuis toujours — mis à jour à chaque nouvelle vue.',
       'TOP_TOUJOURS', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "playlists" WHERE "type" = 'TOP_TOUJOURS');
