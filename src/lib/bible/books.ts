/**
 * Les 66 livres de la Bible Louis Segond 1910 (prisma/bible-data/lsg1910.json)
 * avec les abréviations françaises courantes, pour l'analyseur de références.
 *
 * Les alias sont écrits sous forme « normalisée » (voir normalizeBookName) :
 * minuscules, sans accents, sans espaces, points ni tirets — « 1 Co. » → « 1co ».
 * Les slugs et noms sont vérifiés contre le fichier LSG 1910 par les tests.
 */

export type BibleBook = {
  slug: string;
  /** Nom affiché dans une référence formatée (« Psaume » au singulier pour un seul psaume). */
  name: string;
  aliases: string[];
};

const numbered = (n: 1 | 2 | 3, slugBase: string, name: string, stems: string[]): BibleBook => ({
  slug: `${n}-${slugBase}`,
  name: `${n} ${name}`,
  aliases: stems.map((s) => `${n}${s}`),
});

export const BIBLE_BOOKS: BibleBook[] = [
  { slug: "genese", name: "Genèse", aliases: ["gn", "ge", "gen", "genese"] },
  { slug: "exode", name: "Exode", aliases: ["ex", "exo", "exod", "exode"] },
  { slug: "levitique", name: "Lévitique", aliases: ["lv", "le", "lev", "levitique"] },
  { slug: "nombres", name: "Nombres", aliases: ["nb", "no", "nom", "nomb", "nombres"] },
  { slug: "deuteronome", name: "Deutéronome", aliases: ["dt", "deu", "deut", "deuteronome"] },
  { slug: "josue", name: "Josué", aliases: ["jos", "josue"] },
  { slug: "juges", name: "Juges", aliases: ["jg", "jug", "juges"] },
  { slug: "ruth", name: "Ruth", aliases: ["rt", "ru", "rut", "ruth"] },
  numbered(1, "samuel", "Samuel", ["s", "sa", "sam", "samuel"]),
  numbered(2, "samuel", "Samuel", ["s", "sa", "sam", "samuel"]),
  numbered(1, "rois", "Rois", ["r", "ro", "rois"]),
  numbered(2, "rois", "Rois", ["r", "ro", "rois"]),
  numbered(1, "chroniques", "Chroniques", ["ch", "chr", "chron", "chroniques"]),
  numbered(2, "chroniques", "Chroniques", ["ch", "chr", "chron", "chroniques"]),
  { slug: "esdras", name: "Esdras", aliases: ["esd", "esdr", "esdras"] },
  { slug: "nehemie", name: "Néhémie", aliases: ["ne", "neh", "nehemie"] },
  { slug: "esther", name: "Esther", aliases: ["est", "esth", "esther"] },
  { slug: "job", name: "Job", aliases: ["jb", "job"] },
  { slug: "psaumes", name: "Psaumes", aliases: ["ps", "psa", "psm", "psaume", "psaumes"] },
  { slug: "proverbes", name: "Proverbes", aliases: ["pr", "pro", "prov", "proverbe", "proverbes"] },
  { slug: "ecclesiaste", name: "Ecclésiaste", aliases: ["ec", "ecc", "eccl", "qo", "qoh", "qohelet", "ecclesiaste"] },
  {
    slug: "cantique-des-cantiques",
    name: "Cantique des Cantiques",
    aliases: ["ct", "can", "cant", "cantique", "cantiques", "cantiquedescantiques"],
  },
  { slug: "esaie", name: "Ésaïe", aliases: ["es", "esa", "is", "isa", "esaie", "isaie"] },
  { slug: "jeremie", name: "Jérémie", aliases: ["jr", "jer", "jeremie"] },
  { slug: "lamentations", name: "Lamentations", aliases: ["lm", "la", "lam", "lamentations"] },
  { slug: "ezechiel", name: "Ézéchiel", aliases: ["ez", "eze", "ezec", "ezech", "ezechiel"] },
  { slug: "daniel", name: "Daniel", aliases: ["dn", "da", "dan", "daniel"] },
  { slug: "osee", name: "Osée", aliases: ["os", "ose", "osee"] },
  { slug: "joel", name: "Joël", aliases: ["jl", "joe", "joel"] },
  { slug: "amos", name: "Amos", aliases: ["am", "amo", "amos"] },
  { slug: "abdias", name: "Abdias", aliases: ["ab", "abd", "abdias"] },
  { slug: "jonas", name: "Jonas", aliases: ["jon", "jonas"] },
  { slug: "michee", name: "Michée", aliases: ["mi", "mic", "mich", "michee"] },
  { slug: "nahum", name: "Nahum", aliases: ["na", "nah", "nahum"] },
  { slug: "habacuc", name: "Habacuc", aliases: ["ha", "hab", "habacuc"] },
  { slug: "sophonie", name: "Sophonie", aliases: ["so", "sop", "soph", "sophonie"] },
  { slug: "aggee", name: "Aggée", aliases: ["ag", "agg", "aggee"] },
  { slug: "zacharie", name: "Zacharie", aliases: ["za", "zac", "zach", "zacharie"] },
  { slug: "malachie", name: "Malachie", aliases: ["ml", "mal", "malachie"] },
  { slug: "matthieu", name: "Matthieu", aliases: ["mt", "mat", "matt", "matthieu"] },
  { slug: "marc", name: "Marc", aliases: ["mc", "mr", "mar", "marc"] },
  { slug: "luc", name: "Luc", aliases: ["lc", "lu", "luc"] },
  { slug: "jean", name: "Jean", aliases: ["jn", "jea", "jean"] },
  { slug: "actes", name: "Actes", aliases: ["ac", "act", "actes"] },
  { slug: "romains", name: "Romains", aliases: ["rm", "ro", "rom", "romains"] },
  numbered(1, "corinthiens", "Corinthiens", ["co", "cor", "corinthiens"]),
  numbered(2, "corinthiens", "Corinthiens", ["co", "cor", "corinthiens"]),
  { slug: "galates", name: "Galates", aliases: ["ga", "gal", "galates"] },
  { slug: "ephesiens", name: "Éphésiens", aliases: ["ep", "eph", "ephes", "ephesiens"] },
  { slug: "philippiens", name: "Philippiens", aliases: ["ph", "phi", "phil", "philip", "philippiens"] },
  { slug: "colossiens", name: "Colossiens", aliases: ["col", "colossiens"] },
  numbered(1, "thessaloniciens", "Thessaloniciens", ["th", "thes", "thess", "thessaloniciens"]),
  numbered(2, "thessaloniciens", "Thessaloniciens", ["th", "thes", "thess", "thessaloniciens"]),
  numbered(1, "timothee", "Timothée", ["tm", "ti", "tim", "timothee"]),
  numbered(2, "timothee", "Timothée", ["tm", "ti", "tim", "timothee"]),
  { slug: "tite", name: "Tite", aliases: ["tt", "tit", "tite"] },
  { slug: "philemon", name: "Philémon", aliases: ["phm", "phlm", "philem", "philemon"] },
  { slug: "hebreux", name: "Hébreux", aliases: ["he", "heb", "hebr", "hebreux"] },
  { slug: "jacques", name: "Jacques", aliases: ["jc", "jq", "ja", "jac", "jacq", "jacques"] },
  numbered(1, "pierre", "Pierre", ["p", "pi", "pie", "pierre"]),
  numbered(2, "pierre", "Pierre", ["p", "pi", "pie", "pierre"]),
  numbered(1, "jean", "Jean", ["jn", "je", "jea", "jean"]),
  numbered(2, "jean", "Jean", ["jn", "je", "jea", "jean"]),
  numbered(3, "jean", "Jean", ["jn", "je", "jea", "jean"]),
  { slug: "jude", name: "Jude", aliases: ["jud", "jude"] },
  { slug: "apocalypse", name: "Apocalypse", aliases: ["ap", "apo", "apoc", "apocalypse"] },
];

const ORDINALS: [RegExp, string][] = [
  [/^(1(er|re|ere)?|i|premier|premiere)\b/, "1"],
  [/^(2(e|eme|nd|nde)?|ii|deuxieme|second|seconde)\b/, "2"],
  [/^(3(e|eme)?|iii|troisieme)\b/, "3"],
];

/** « 1 Co. », « I Corinthiens », « 1er Jean » → « 1co », « 1corinthiens », « 1jean ». */
export function normalizeBookName(raw: string): string {
  let s = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .trim();
  for (const [re, digit] of ORDINALS) {
    if (re.test(s)) {
      s = s.replace(re, digit);
      break;
    }
  }
  return s.replace(/[\s.\-'’]+/g, "");
}

const BY_ALIAS = new Map<string, BibleBook>();
for (const book of BIBLE_BOOKS) for (const alias of book.aliases) BY_ALIAS.set(alias, book);

/** Livre correspondant à un nom ou une abréviation, ou null (inconnu ou ambigu). */
export function findBook(raw: string): BibleBook | null {
  const key = normalizeBookName(raw);
  if (!key) return null;
  const exact = BY_ALIAS.get(key);
  if (exact) return exact;
  // Début non ambigu d'un nom complet (« Philipp », « Jérém »…), 3 lettres minimum.
  if (key.replace(/^\d/, "").length < 3) return null;
  const candidates = BIBLE_BOOKS.filter((b) => b.aliases.some((a) => a.length > key.length && a.startsWith(key)));
  return candidates.length === 1 ? candidates[0] : null;
}

export function bookBySlug(slug: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.slug === slug);
}
