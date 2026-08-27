-- CreateTable
CREATE TABLE "_ArtistToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArtistToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "artists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArtistToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToTag_AB_unique" ON "_ArtistToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToTag_B_index" ON "_ArtistToTag"("B");
