-- AlterTable
ALTER TABLE "songs" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'FICHIER_DIRECT';

-- CreateTable
CREATE TABLE "takedown_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contentType" TEXT,
    "contentId" TEXT,
    "contentTitle" TEXT,
    "contentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "takedown_reports_status_createdAt_idx" ON "takedown_reports"("status", "createdAt");
