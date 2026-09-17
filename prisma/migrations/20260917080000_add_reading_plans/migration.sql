-- CreateTable
CREATE TABLE "reading_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "coverImageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reading_plan_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    CONSTRAINT "reading_plan_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "reading_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_plan_passages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "bookSlug" TEXT NOT NULL,
    "bookName" TEXT NOT NULL,
    "chapterStart" INTEGER NOT NULL,
    "chapterEnd" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "reading_plan_passages_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "reading_plan_days" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "reading_plans_slug_key" ON "reading_plans"("slug");

-- CreateIndex
CREATE INDEX "reading_plans_published_idx" ON "reading_plans"("published");

-- CreateIndex
CREATE UNIQUE INDEX "reading_plan_days_planId_dayNumber_key" ON "reading_plan_days"("planId", "dayNumber");

-- CreateIndex
CREATE INDEX "reading_plan_passages_dayId_position_idx" ON "reading_plan_passages"("dayId", "position");
