/**
 * Exporte le texte biblique de Lepolo_Bible (base SQLite locale, schéma
 * versions/books/verses) vers un fichier JSON portable, réimportable dans
 * Zone-Chrétien via import-to-zonechretien.ts.
 *
 * Usage :
 *   npx tsx scripts/bible/export-from-lepolo.ts [chemin-vers-lepolo_bible.db] [code-version]
 *
 * Par défaut : chemin standard AppData de l'app Lepolo_Bible, version LSG1910.
 */
import { createClient } from "@libsql/client";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { slugify } from "../../src/lib/utils";

const DEFAULT_SOURCE_PATH =
  "C:\\Users\\elianea\\AppData\\Roaming\\Lepolo_Bible\\lepolo_bible.db";

type SourceBook = {
  id: number;
  testament: "AT" | "NT";
  ordre: number;
  nom: string;
  abbrev: string;
  nb_chapitres: number;
};

type SourceVerse = {
  book_id: number;
  chapitre: number;
  verset: number;
  texte: string;
};

async function main() {
  const sourcePath = process.argv[2] ?? DEFAULT_SOURCE_PATH;
  const versionCode = process.argv[3] ?? "LSG1910";

  const db = createClient({ url: `file:${sourcePath}` });

  const versionRow = await db.execute({
    sql: "SELECT id, code, nom, langue, licence FROM versions WHERE code = ?",
    args: [versionCode],
  });
  if (versionRow.rows.length === 0) {
    throw new Error(`Version "${versionCode}" introuvable dans ${sourcePath}`);
  }
  const version = versionRow.rows[0] as unknown as {
    id: number;
    code: string;
    nom: string;
    langue: string;
    licence: string | null;
  };

  const booksResult = await db.execute({
    sql: "SELECT id, testament, ordre, nom, abbrev, nb_chapitres FROM books WHERE version_id = ? ORDER BY ordre",
    args: [version.id],
  });
  const sourceBooks = booksResult.rows as unknown as SourceBook[];

  const versesResult = await db.execute({
    sql: `SELECT v.book_id, v.chapitre, v.verset, v.texte
          FROM verses v
          JOIN books b ON b.id = v.book_id
          WHERE b.version_id = ?
          ORDER BY b.ordre, v.chapitre, v.verset`,
    args: [version.id],
  });
  const sourceVerses = versesResult.rows as unknown as SourceVerse[];

  console.log(`Livres trouvés : ${sourceBooks.length}`);
  console.log(`Versets trouvés : ${sourceVerses.length}`);

  const versesByBook = new Map<number, SourceVerse[]>();
  for (const v of sourceVerses) {
    if (!versesByBook.has(v.book_id)) versesByBook.set(v.book_id, []);
    versesByBook.get(v.book_id)!.push(v);
  }

  const usedSlugs = new Set<string>();
  const books = sourceBooks.map((book) => {
    let slug = slugify(book.nom);
    if (usedSlugs.has(slug)) slug = `${slug}-${book.ordre}`; // filet de sécurité, pas de collision attendue
    usedSlugs.add(slug);

    const versesForBook = versesByBook.get(book.id) ?? [];
    const versesByChapter = new Map<number, SourceVerse[]>();
    for (const v of versesForBook) {
      if (!versesByChapter.has(v.chapitre)) versesByChapter.set(v.chapitre, []);
      versesByChapter.get(v.chapitre)!.push(v);
    }

    const chapters = [...versesByChapter.entries()]
      .sort(([a], [b]) => a - b)
      .map(([number, verses]) => ({
        number,
        verses: verses
          .sort((a, b) => a.verset - b.verset)
          .map((v) => ({ number: v.verset, text: v.texte })),
      }));

    return {
      order: book.ordre,
      testament: book.testament,
      name: book.nom,
      slug,
      abbreviation: book.abbrev,
      chapterCount: book.nb_chapitres,
      chapters,
    };
  });

  const output = {
    version: {
      code: version.code,
      name: version.nom,
      language: version.langue,
      license: version.licence,
    },
    books,
  };

  const outPath = join(__dirname, "..", "..", "prisma", "bible-data", `${slugify(versionCode)}.json`);
  writeFileSync(outPath, JSON.stringify(output), "utf-8");
  console.log(`Écrit : ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
