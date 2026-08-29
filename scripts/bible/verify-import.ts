/**
 * Vérifie l'intégrité de l'import : compare le nombre de livres/versets et
 * un échantillon de versets connus entre Lepolo_Bible (source) et
 * Zone-Chrétien (base importée).
 *
 * Usage :
 *   npx tsx --env-file=.env scripts/bible/verify-import.ts [chemin-lepolo.db] [code-version]
 */
import { createClient } from "@libsql/client";
import { prisma } from "../../src/lib/db";

const DEFAULT_SOURCE_PATH = "C:\\Users\\elianea\\AppData\\Roaming\\Lepolo_Bible\\lepolo_bible.db";

// [livre, chapitre, verset] — échantillon couvrant AT/NT, début/milieu/fin
const SAMPLE_REFERENCES: [string, number, number][] = [
  ["Genèse", 1, 1],
  ["Exode", 20, 3],
  ["Psaumes", 23, 1],
  ["Ésaïe", 53, 5],
  ["Matthieu", 5, 3],
  ["Jean", 3, 16],
  ["Romains", 8, 28],
  ["1 Corinthiens", 13, 4],
  ["Apocalypse", 22, 21],
];

async function main() {
  const sourcePath = process.argv[2] ?? DEFAULT_SOURCE_PATH;
  const versionCode = process.argv[3] ?? "LSG1910";

  const source = createClient({ url: `file:${sourcePath}` });

  let ok = true;

  // 1. Nombre de livres
  const sourceBookCount = await source.execute({
    sql: "SELECT COUNT(*) as n FROM books b JOIN versions v ON v.id = b.version_id WHERE v.code = ?",
    args: [versionCode],
  });
  const targetBookCount = await prisma.bibleBook.count({ where: { version: { code: versionCode } } });
  const nSourceBooks = Number((sourceBookCount.rows[0] as unknown as { n: number }).n);
  console.log(`Livres — source : ${nSourceBooks}, Zone-Chrétien : ${targetBookCount}`);
  if (nSourceBooks !== 66 || targetBookCount !== 66) {
    console.error("  ÉCHEC : attendu 66 livres des deux côtés.");
    ok = false;
  } else {
    console.log("  OK");
  }

  // 2. Nombre de versets
  const sourceVerseCount = await source.execute({
    sql: `SELECT COUNT(*) as n FROM verses vs JOIN books b ON b.id = vs.book_id JOIN versions v ON v.id = b.version_id WHERE v.code = ?`,
    args: [versionCode],
  });
  const targetVerseCount = await prisma.bibleVerse.count({ where: { chapter: { book: { version: { code: versionCode } } } } });
  const nSourceVerses = Number((sourceVerseCount.rows[0] as unknown as { n: number }).n);
  console.log(`\nVersets — source : ${nSourceVerses}, Zone-Chrétien : ${targetVerseCount}`);
  if (nSourceVerses !== targetVerseCount) {
    console.error("  ÉCHEC : nombre de versets différent.");
    ok = false;
  } else {
    console.log("  OK");
  }

  // 3. Échantillon de versets comparés texte pour texte
  console.log("\nÉchantillon :");
  for (const [bookName, chapitre, verset] of SAMPLE_REFERENCES) {
    const sourceRow = await source.execute({
      sql: `SELECT vs.texte FROM verses vs
            JOIN books b ON b.id = vs.book_id
            JOIN versions v ON v.id = b.version_id
            WHERE v.code = ? AND b.nom = ? AND vs.chapitre = ? AND vs.verset = ?`,
      args: [versionCode, bookName, chapitre, verset],
    });
    const sourceText = (sourceRow.rows[0] as unknown as { texte: string } | undefined)?.texte;

    const targetVerse = await prisma.bibleVerse.findFirst({
      where: {
        number: verset,
        chapter: { number: chapitre, book: { name: bookName, version: { code: versionCode } } },
      },
      select: { text: true },
    });

    const match = sourceText != null && sourceText === targetVerse?.text;
    console.log(`  ${bookName} ${chapitre}:${verset} — ${match ? "OK" : "ÉCHEC"}`);
    if (!match) {
      ok = false;
      console.log(`    source     : ${sourceText ?? "(introuvable)"}`);
      console.log(`    zone-chretien : ${targetVerse?.text ?? "(introuvable)"}`);
    }
  }

  console.log(ok ? "\n✔ Vérification réussie." : "\n✘ Vérification échouée — voir détails ci-dessus.");
  if (!ok) process.exitCode = 1;
}

main().then(() => prisma.$disconnect()).catch((err) => {
  console.error(err);
  return prisma.$disconnect().finally(() => process.exit(1));
});
