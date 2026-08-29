import { prisma } from "@/lib/db";

// Une seule traduction disponible pour l'instant (LSG1910), mais le schéma
// (BibleVersion) permet d'en ajouter d'autres plus tard sans migration.
export const DEFAULT_BIBLE_VERSION = "LSG1910";

export function getBibleBooks() {
  return prisma.bibleBook.findMany({
    where: { version: { code: DEFAULT_BIBLE_VERSION } },
    orderBy: { order: "asc" },
  });
}

export function getBibleBookBySlug(slug: string) {
  return prisma.bibleBook.findFirst({
    where: { slug, version: { code: DEFAULT_BIBLE_VERSION } },
    include: {
      chapters: { orderBy: { number: "asc" }, select: { number: true, verseCount: true } },
    },
  });
}

type ChapterNavRef = { bookSlug: string; bookName: string; chapterNumber: number };

export async function getBibleChapter(bookSlug: string, chapterNumber: number) {
  const book = await prisma.bibleBook.findFirst({
    where: { slug: bookSlug, version: { code: DEFAULT_BIBLE_VERSION } },
  });
  if (!book) return null;

  const chapter = await prisma.bibleChapter.findUnique({
    where: { bookId_number: { bookId: book.id, number: chapterNumber } },
    include: { verses: { orderBy: { number: "asc" } } },
  });
  if (!chapter) return null;

  let prev: ChapterNavRef | null = null;
  let next: ChapterNavRef | null = null;

  if (chapterNumber > 1) {
    prev = { bookSlug: book.slug, bookName: book.name, chapterNumber: chapterNumber - 1 };
  } else {
    const prevBook = await prisma.bibleBook.findFirst({
      where: { version: { code: DEFAULT_BIBLE_VERSION }, order: book.order - 1 },
    });
    if (prevBook) {
      prev = { bookSlug: prevBook.slug, bookName: prevBook.name, chapterNumber: prevBook.chapterCount };
    }
  }

  if (chapterNumber < book.chapterCount) {
    next = { bookSlug: book.slug, bookName: book.name, chapterNumber: chapterNumber + 1 };
  } else {
    const nextBook = await prisma.bibleBook.findFirst({
      where: { version: { code: DEFAULT_BIBLE_VERSION }, order: book.order + 1 },
    });
    if (nextBook) {
      next = { bookSlug: nextBook.slug, bookName: nextBook.name, chapterNumber: 1 };
    }
  }

  return { book, chapter, prev, next };
}

/**
 * Neutralise la syntaxe de requête FTS5 (guillemets, opérateurs booléens,
 * parenthèses...) en encadrant chaque terme de guillemets doubles avec un
 * caractère joker de préfixe — évite à la fois l'injection SQL (déjà gérée
 * par le paramétrage de Prisma) et les erreurs de syntaxe FTS5.
 */
function buildFtsQuery(raw: string): string {
  const terms = raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((term) => `"${term.replace(/"/g, '""')}"*`);
  return terms.join(" AND ");
}

export type BibleSearchResult = {
  bookName: string;
  bookSlug: string;
  chapterNumber: number;
  verseNumber: number;
  snippet: string;
};

export type RandomBibleVerse = {
  id: number;
  number: number;
  text: string;
  chapterNumber: number;
  bookName: string;
};

/** Verset aléatoire dans toute la Bible — alimente le "verset du jour" quand rien n'est programmé pour la date. */
export async function getRandomBibleVerse(): Promise<RandomBibleVerse | null> {
  const rows = await prisma.$queryRaw<RandomBibleVerse[]>`
    SELECT bv.id, bv.number, bv.text, bc.number AS chapterNumber, bb.name AS bookName
    FROM bible_verses bv
    JOIN bible_chapters bc ON bc.id = bv.chapterId
    JOIN bible_books bb ON bb.id = bc.bookId
    WHERE bb.versionId = (SELECT id FROM bible_versions WHERE code = ${DEFAULT_BIBLE_VERSION})
    ORDER BY RANDOM()
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function searchBible(rawQuery: string, limit = 30): Promise<BibleSearchResult[]> {
  const ftsQuery = buildFtsQuery(rawQuery);
  if (!ftsQuery) return [];

  return prisma.$queryRaw<BibleSearchResult[]>`
    SELECT
      bb.name AS bookName,
      bb.slug AS bookSlug,
      bc.number AS chapterNumber,
      bv.number AS verseNumber,
      snippet(bible_verses_fts, 0, '<mark>', '</mark>', '…', 14) AS snippet
    FROM bible_verses_fts f
    JOIN bible_verses bv ON bv.id = f.rowid
    JOIN bible_chapters bc ON bc.id = bv.chapterId
    JOIN bible_books bb ON bb.id = bc.bookId
    WHERE bible_verses_fts MATCH ${ftsQuery} AND bb.versionId = (
      SELECT id FROM bible_versions WHERE code = ${DEFAULT_BIBLE_VERSION}
    )
    ORDER BY rank
    LIMIT ${limit}
  `;
}
