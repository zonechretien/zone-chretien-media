// Classification statique des 66 livres bibliques en 8 sous-sections
// canoniques (4 pour l'Ancien Testament, 4 pour le Nouveau). Ces groupes ne
// changent jamais — pas de champ en base, juste une table de correspondance.
// Slugs vérifiés directement contre prisma/bible-data/lsg1910.json.

export type BibleTestamentCode = "AT" | "NT";

export type BookGroup = {
  key: string;
  label: string;
  testament: BibleTestamentCode;
  bookSlugs: string[];
};

export const BIBLE_BOOK_GROUPS: BookGroup[] = [
  {
    key: "pentateuque",
    label: "Pentateuque",
    testament: "AT",
    bookSlugs: ["genese", "exode", "levitique", "nombres", "deuteronome"],
  },
  {
    key: "historiques",
    label: "Livres historiques",
    testament: "AT",
    bookSlugs: [
      "josue", "juges", "ruth", "1-samuel", "2-samuel", "1-rois", "2-rois",
      "1-chroniques", "2-chroniques", "esdras", "nehemie", "esther",
    ],
  },
  {
    key: "poetiques",
    label: "Livres poétiques",
    testament: "AT",
    bookSlugs: ["job", "psaumes", "proverbes", "ecclesiaste", "cantique-des-cantiques"],
  },
  {
    key: "prophetes",
    label: "Prophètes",
    testament: "AT",
    bookSlugs: [
      "esaie", "jeremie", "lamentations", "ezechiel", "daniel", "osee", "joel",
      "amos", "abdias", "jonas", "michee", "nahum", "habacuc", "sophonie",
      "aggee", "zacharie", "malachie",
    ],
  },
  {
    key: "evangiles",
    label: "Évangiles",
    testament: "NT",
    bookSlugs: ["matthieu", "marc", "luc", "jean"],
  },
  {
    key: "actes",
    label: "Actes",
    testament: "NT",
    bookSlugs: ["actes"],
  },
  {
    key: "epitres",
    label: "Épîtres",
    testament: "NT",
    bookSlugs: [
      "romains", "1-corinthiens", "2-corinthiens", "galates", "ephesiens",
      "philippiens", "colossiens", "1-thessaloniciens", "2-thessaloniciens",
      "1-timothee", "2-timothee", "tite", "philemon", "hebreux", "jacques",
      "1-pierre", "2-pierre", "1-jean", "2-jean", "3-jean", "jude",
    ],
  },
  {
    key: "apocalypse",
    label: "Apocalypse",
    testament: "NT",
    bookSlugs: ["apocalypse"],
  },
];

const GROUP_BY_SLUG = new Map<string, string>(
  BIBLE_BOOK_GROUPS.flatMap((group) => group.bookSlugs.map((slug) => [slug, group.key])),
);

export function getBookGroupKey(bookSlug: string): string | undefined {
  return GROUP_BY_SLUG.get(bookSlug);
}

/**
 * Regroupe une liste de livres (déjà triée par `order`) selon leur section
 * canonique, en conservant cet ordre à l'intérieur de chaque groupe.
 */
export function groupBooks<T extends { slug: string; testament: BibleTestamentCode }>(
  books: T[],
): { group: BookGroup; books: T[] }[] {
  const booksBySlug = new Map(books.map((book) => [book.slug, book]));

  return BIBLE_BOOK_GROUPS.map((group) => ({
    group,
    books: group.bookSlugs
      .map((slug) => booksBySlug.get(slug))
      .filter((book): book is T => book !== undefined),
  })).filter((entry) => entry.books.length > 0);
}
