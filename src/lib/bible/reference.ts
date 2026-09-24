import { bookBySlug, findBook } from "./books";

/**
 * Analyseur de références bibliques en français.
 *
 * Formes acceptées (exemples) :
 *   « Psaume 34:8 », « Ps 34.8 », « Ps 34, 8 », « Jean 3:16-17 », « Jean 3:16–4:2 »,
 *   « 1 Co 13:4 », « 1Co 13:4-7 », « I Corinthiens 13 », « 1er Jean 4:8 », « Jn 3 v 16 »,
 *   « Ésaïe 40:31 à 40:33 ».
 * Un chapitre seul (« Psaume 23 ») désigne le chapitre entier.
 */

export type BibleReference = {
  bookSlug: string;
  chapterStart: number;
  /** null = chapitre entier. */
  verseStart: number | null;
  chapterEnd: number;
  verseEnd: number | null;
};

export type ParseResult = { ok: true; ref: BibleReference } | { ok: false; error: string };

// Séparateur chapitre / verset : « : », « . », « , », « v » ou une simple espace (« Jn 3 16 »).
const SEP = String.raw`(?:\s*(?:[:.,]|v\.?)\s*|\s+)`;
const NUMBER_SECTION = new RegExp(
  String.raw`^(\d{1,3})(?:${SEP}(\d{1,3}))?(?:\s*(?:-|–|—|à|a)\s*(?:(\d{1,3})${SEP})?(\d{1,3}))?$`,
  "i",
);

export function parseReference(input: string): ParseResult {
  const text = input.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, error: "Saisissez une référence, par exemple « Jean 3:16 »." };

  // Le livre est tout ce qui précède le dernier bloc de chiffres « chapitre[:verset][-…] ».
  // Le chiffre initial éventuel (« 1 Co ») fait partie du nom du livre.
  const m = /^(.*?[^\d\s].*?)\s*(\d.*)$/.exec(text);
  if (!m) return { ok: false, error: `Référence incomplète : « ${text} » (livre et chapitre attendus).` };
  const [, bookPart, numbers] = m;

  const book = findBook(bookPart);
  if (!book) return { ok: false, error: `Livre biblique inconnu : « ${bookPart.trim()} ».` };

  const n = NUMBER_SECTION.exec(numbers.trim());
  if (!n) return { ok: false, error: `Chapitre et versets illisibles : « ${numbers.trim()} ». Exemple : 3:16-17.` };

  const [, c1s, v1s, c2s, v2s] = n;
  const chapterStart = Number(c1s);
  const verseStart = v1s ? Number(v1s) : null;
  let chapterEnd = chapterStart;
  let verseEnd: number | null = verseStart;

  if (v2s) {
    if (c2s) {
      // Jean 3:16-4:2
      chapterEnd = Number(c2s);
      verseEnd = Number(v2s);
      if (verseStart === null) return { ok: false, error: "Indiquez le verset de départ (ex. 3:16-4:2)." };
    } else if (verseStart === null) {
      // « Psaume 23-24 » : plusieurs chapitres entiers.
      chapterEnd = Number(v2s);
      verseEnd = null;
    } else {
      verseEnd = Number(v2s);
    }
  }

  if (chapterStart < 1 || (verseStart !== null && verseStart < 1)) return { ok: false, error: "Les chapitres et versets commencent à 1." };
  if (chapterEnd < chapterStart || (chapterEnd === chapterStart && verseStart !== null && verseEnd !== null && verseEnd < verseStart)) {
    return { ok: false, error: "La fin du passage est avant son début." };
  }

  return { ok: true, ref: { bookSlug: book.slug, chapterStart, verseStart, chapterEnd, verseEnd } };
}

/** Référence mise en forme : « Psaume 34:8 », « Jean 3:16-17 », « Jean 3:16-4:2 », « Psaumes 23-24 ». */
export function formatReference(ref: BibleReference): string {
  const book = bookBySlug(ref.bookSlug);
  if (!book) return "";
  const singleChapter = ref.chapterStart === ref.chapterEnd;
  const name = book.slug === "psaumes" && singleChapter ? "Psaume" : book.name;

  if (ref.verseStart === null) {
    return singleChapter ? `${name} ${ref.chapterStart}` : `${name} ${ref.chapterStart}-${ref.chapterEnd}`;
  }
  if (singleChapter) {
    return ref.verseEnd === null || ref.verseEnd === ref.verseStart
      ? `${name} ${ref.chapterStart}:${ref.verseStart}`
      : `${name} ${ref.chapterStart}:${ref.verseStart}-${ref.verseEnd}`;
  }
  return `${name} ${ref.chapterStart}:${ref.verseStart}-${ref.chapterEnd}:${ref.verseEnd}`;
}
