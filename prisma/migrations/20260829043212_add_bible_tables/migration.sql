-- CreateTable
CREATE TABLE "bible_versions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "license" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bible_books" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "versionId" INTEGER NOT NULL,
    "testament" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "chapterCount" INTEGER NOT NULL,
    CONSTRAINT "bible_books_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "bible_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_chapters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "verseCount" INTEGER NOT NULL,
    CONSTRAINT "bible_chapters_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "bible_books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_verses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chapterId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "bible_verses_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "bible_chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "bible_versions_code_key" ON "bible_versions"("code");

-- CreateIndex
CREATE INDEX "bible_books_versionId_testament_idx" ON "bible_books"("versionId", "testament");

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_versionId_order_key" ON "bible_books"("versionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_versionId_slug_key" ON "bible_books"("versionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "bible_chapters_bookId_number_key" ON "bible_chapters"("bookId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verses_chapterId_number_key" ON "bible_verses"("chapterId", "number");

-- Recherche plein texte (FTS5) sur le texte des versets — table externe non
-- gérée par Prisma (les tables virtuelles ne font pas partie de son schéma),
-- content_rowid='id' fonctionne car BibleVerse utilise un id INTEGER
-- AUTOINCREMENT (alias du rowid SQLite), exactement comme dans Lepolo_Bible.
CREATE VIRTUAL TABLE "bible_verses_fts" USING fts5(
    text,
    content='bible_verses',
    content_rowid='id'
);

CREATE TRIGGER "bible_verses_ai" AFTER INSERT ON "bible_verses" BEGIN
    INSERT INTO "bible_verses_fts"(rowid, text) VALUES (new.id, new.text);
END;

CREATE TRIGGER "bible_verses_ad" AFTER DELETE ON "bible_verses" BEGIN
    INSERT INTO "bible_verses_fts"("bible_verses_fts", rowid, text) VALUES('delete', old.id, old.text);
END;

CREATE TRIGGER "bible_verses_au" AFTER UPDATE ON "bible_verses" BEGIN
    INSERT INTO "bible_verses_fts"("bible_verses_fts", rowid, text) VALUES('delete', old.id, old.text);
    INSERT INTO "bible_verses_fts"(rowid, text) VALUES (new.id, new.text);
END;
