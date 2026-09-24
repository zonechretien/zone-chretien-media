-- CreateTable
CREATE TABLE "reel_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lastExportPath" TEXT,
    "lastExportAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "reel_projects_updatedAt_idx" ON "reel_projects"("updatedAt");

-- CreateIndex
CREATE INDEX "reel_projects_sourceType_sourceId_idx" ON "reel_projects"("sourceType", "sourceId");

