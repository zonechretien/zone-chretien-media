/**
 * Importe un fichier JSON généré par export-from-lepolo.ts dans la base
 * Zone-Chrétien (BibleVersion/BibleBook/BibleChapter/BibleVerse).
 *
 * Usage :
 *   npx tsx --env-file=.env scripts/bible/import-to-zonechretien.ts [chemin.json] [--force]
 *
 * --force : si la version existe déjà avec des livres importés, les
 * supprime (cascade) avant de réimporter. Sans ce flag, le script refuse
 * de dupliquer un import existant.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../../src/lib/db";

const VERSE_CHUNK_SIZE = 500;

type ImportVerse = { number: number; text: string };
type ImportChapter = { number: number; verses: ImportVerse[] };
type ImportBook = {
  order: number;
  testament: "AT" | "NT";
  name: string;
  slug: string;
  abbreviation: string;
  chapterCount: number;
  chapters: ImportChapter[];
};
type ImportData = {
  version: { code: string; name: string; language: string; license: string | null };
  books: ImportBook[];
};

async function main() {
  const force = process.argv.includes("--force");
  const jsonPath = process.argv[2] ?? join(__dirname, "..", "..", "prisma", "bible-data", "lsg1910.json");

  const data: ImportData = JSON.parse(readFileSync(jsonPath, "utf-8"));
  console.log(`Source : ${jsonPath}`);
  console.log(`Version : ${data.version.code} — ${data.books.length} livres`);

  const existing = await prisma.bibleVersion.findUnique({
    where: { code: data.version.code },
    include: { _count: { select: { books: true } } },
  });

  if (existing && existing._count.books > 0) {
    if (!force) {
      console.error(
        `La version "${data.version.code}" a déjà ${existing._count.books} livre(s) importé(s). Relancez avec --force pour tout remplacer.`,
      );
      process.exit(1);
    }
    console.log(`--force : suppression de la version existante (${existing._count.books} livres, cascade)...`);
    await prisma.bibleVersion.delete({ where: { id: existing.id } });
  }

  const version = await prisma.bibleVersion.upsert({
    where: { code: data.version.code },
    update: { name: data.version.name, language: data.version.language, license: data.version.license },
    create: {
      code: data.version.code,
      name: data.version.name,
      language: data.version.language,
      license: data.version.license,
    },
  });

  let totalChapters = 0;
  let totalVerses = 0;

  for (const book of data.books) {
    const createdBook = await prisma.bibleBook.create({
      data: {
        versionId: version.id,
        testament: book.testament,
        order: book.order,
        name: book.name,
        slug: book.slug,
        abbreviation: book.abbreviation,
        chapterCount: book.chapterCount,
      },
    });

    const versesToInsert: { chapterId: number; number: number; text: string }[] = [];

    for (const chapter of book.chapters) {
      const createdChapter = await prisma.bibleChapter.create({
        data: { bookId: createdBook.id, number: chapter.number, verseCount: chapter.verses.length },
      });
      totalChapters++;
      for (const verse of chapter.verses) {
        versesToInsert.push({ chapterId: createdChapter.id, number: verse.number, text: verse.text });
      }
    }

    for (let i = 0; i < versesToInsert.length; i += VERSE_CHUNK_SIZE) {
      const chunk = versesToInsert.slice(i, i + VERSE_CHUNK_SIZE);
      await prisma.bibleVerse.createMany({ data: chunk });
      totalVerses += chunk.length;
    }

    console.log(`  ${book.name} : ${book.chapters.length} chapitres, ${versesToInsert.length} versets`);
  }

  console.log(`\nTerminé : ${data.books.length} livres, ${totalChapters} chapitres, ${totalVerses} versets.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
