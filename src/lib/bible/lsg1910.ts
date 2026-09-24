import fs from "node:fs";
import path from "node:path";
import { formatReference, parseReference, type BibleReference } from "./reference";

/**
 * Texte de la Bible Louis Segond 1910 (domaine public), lu depuis le fichier
 * du dépôt prisma/bible-data/lsg1910.json — aucun service externe : la
 * recherche fonctionne sans Internet. Voir docs/BIBLE-LSG1910.md.
 *
 * Le fichier (≈ 5 Mo) est chargé une seule fois par instance serveur.
 */
export const BIBLE_FILE = path.join(process.cwd(), "prisma", "bible-data", "lsg1910.json");

type BibleJson = {
  version: { code: string; name: string; license: string };
  books: { slug: string; name: string; chapters: { number: number; verses: { number: number; text: string }[] }[] }[];
};

type Chapters = Map<number, Map<number, string>>;

let cache: Map<string, Chapters> | null = null;

function load(): Map<string, Chapters> {
  if (cache) return cache;
  const json = JSON.parse(fs.readFileSync(BIBLE_FILE, "utf8")) as BibleJson;
  if (json.version.code !== "LSG1910") throw new Error(`Version biblique inattendue : ${json.version.code}`);
  const books = new Map<string, Chapters>();
  for (const book of json.books) {
    const chapters: Chapters = new Map();
    for (const c of book.chapters) chapters.set(c.number, new Map(c.verses.map((v) => [v.number, v.text])));
    books.set(book.slug, chapters);
  }
  cache = books;
  return books;
}

export type Passage = {
  reference: string;
  text: string;
  verseCount: number;
  /** Le passage commence au verset 1 d'un psaume : le titre (« Cantique de David »…) y est inclus. */
  includesPsalmTitle: boolean;
};

export type PassageResult = { ok: true; passage: Passage } | { ok: false; error: string };

export function getPassage(ref: BibleReference): PassageResult {
  const chapters = load().get(ref.bookSlug);
  if (!chapters) return { ok: false, error: "Livre introuvable dans la LSG 1910." };
  const label = formatReference(ref);

  const verses: string[] = [];
  for (let c = ref.chapterStart; c <= ref.chapterEnd; c++) {
    const chapter = chapters.get(c);
    if (!chapter) return { ok: false, error: `${label} : le chapitre ${c} n'existe pas (ce livre en compte ${chapters.size}).` };
    const last = Math.max(...chapter.keys());
    const from = c === ref.chapterStart && ref.verseStart !== null ? ref.verseStart : 1;
    const to = c === ref.chapterEnd && ref.verseEnd !== null ? ref.verseEnd : last;
    if (from > last || to > last) {
      return { ok: false, error: `${label} : le chapitre ${c} n'a que ${last} versets.` };
    }
    for (let v = from; v <= to; v++) {
      const text = chapter.get(v);
      if (text) verses.push(text.trim());
    }
  }

  return {
    ok: true,
    passage: {
      reference: label,
      text: verses.join(" "),
      verseCount: verses.length,
      includesPsalmTitle: ref.bookSlug === "psaumes" && (ref.verseStart === null || ref.verseStart === 1),
    },
  };
}

/** Analyse la référence saisie puis renvoie le texte LSG 1910 correspondant. */
export function lookupPassage(input: string): PassageResult {
  const parsed = parseReference(input);
  if (!parsed.ok) return parsed;
  return getPassage(parsed.ref);
}
