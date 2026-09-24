import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BIBLE_BOOKS, findBook } from "./books";
import { formatReference, parseReference, type BibleReference } from "./reference";

const bible = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../prisma/bible-data/lsg1910.json"), "utf8")) as {
  books: { slug: string; name: string }[];
};

function parsed(input: string): BibleReference {
  const r = parseReference(input);
  if (!r.ok) throw new Error(`${input} → ${r.error}`);
  return r.ref;
}

describe("table des livres", () => {
  it("couvre exactement les 66 livres du fichier LSG 1910, dans l'ordre, avec les mêmes noms", () => {
    expect(BIBLE_BOOKS.map((b) => b.slug)).toEqual(bible.books.map((b) => b.slug));
    for (const [i, b] of BIBLE_BOOKS.entries()) expect(b.name).toBe(bible.books[i].name);
  });

  it("n'a aucune abréviation en double", () => {
    const all = BIBLE_BOOKS.flatMap((b) => b.aliases);
    expect(new Set(all).size).toBe(all.length);
  });

  it("chaque livre est retrouvé par son nom complet", () => {
    for (const b of BIBLE_BOOKS) expect(findBook(b.name)?.slug).toBe(b.slug);
  });
});

describe("parseReference — exemples de la spécification", () => {
  it.each([
    ["Psaume 34:8", { bookSlug: "psaumes", chapterStart: 34, verseStart: 8, chapterEnd: 34, verseEnd: 8 }],
    ["Ps 34.8", { bookSlug: "psaumes", chapterStart: 34, verseStart: 8, chapterEnd: 34, verseEnd: 8 }],
    ["Jean 3:16-17", { bookSlug: "jean", chapterStart: 3, verseStart: 16, chapterEnd: 3, verseEnd: 17 }],
    ["1 Co 13:4", { bookSlug: "1-corinthiens", chapterStart: 13, verseStart: 4, chapterEnd: 13, verseEnd: 4 }],
  ])("%s", (input, expected) => expect(parsed(input)).toEqual(expected));
});

describe("parseReference — variantes", () => {
  it.each([
    ["1Co 13:4-7", "1-corinthiens"],
    ["1 Cor. 13:4", "1-corinthiens"],
    ["I Corinthiens 13:4", "1-corinthiens"],
    ["1re Corinthiens 13:4", "1-corinthiens"],
    ["2 Co 5:17", "2-corinthiens"],
    ["1er Jean 4:8", "1-jean"],
    ["1 Jn 4:8", "1-jean"],
    ["3 Jean 1:2", "3-jean"],
    ["Jn 3:16", "jean"],
    ["Psaumes 23:1", "psaumes"],
    ["ps 23 : 1", "psaumes"],
    ["Ésaïe 40:31", "esaie"],
    ["Esaie 40:31", "esaie"],
    ["Is 40:31", "esaie"],
    ["Ph 4:13", "philippiens"],
    ["Phm 1:6", "philemon"],
    ["Philipp 4:13", "philippiens"],
    ["Héb 11:1", "hebreux"],
    ["Mt 6:33", "matthieu"],
    ["Rm 8:28", "romains"],
    ["Ap 21:4", "apocalypse"],
    ["Cantique des cantiques 2:4", "cantique-des-cantiques"],
    ["Qo 3:1", "ecclesiaste"],
    ["Jn 3 v 16", "jean"],
  ])("%s → %s", (input, slug) => expect(parsed(input).bookSlug).toBe(slug));

  it("virgule comme séparateur chapitre / verset", () => {
    expect(parsed("Ps 34, 8")).toMatchObject({ chapterStart: 34, verseStart: 8 });
  });

  it("passage sur deux chapitres", () => {
    expect(parsed("Jean 3:16–4:2")).toEqual({ bookSlug: "jean", chapterStart: 3, verseStart: 16, chapterEnd: 4, verseEnd: 2 });
    expect(parsed("Ésaïe 40:31 à 41:1")).toMatchObject({ chapterEnd: 41, verseEnd: 1 });
  });

  it("chapitre entier et plusieurs chapitres", () => {
    expect(parsed("Psaume 23")).toEqual({ bookSlug: "psaumes", chapterStart: 23, verseStart: null, chapterEnd: 23, verseEnd: null });
    expect(parsed("Ps 23-24")).toMatchObject({ chapterStart: 23, chapterEnd: 24, verseStart: null });
  });
});

describe("parseReference — erreurs", () => {
  it.each([
    ["", /Saisissez/],
    ["Jean", /incomplète/],
    ["Évangile 3:16", /inconnu/],
    ["Jean 3:17-16", /avant son début/],
    ["Jean 0:1", /commencent à 1/],
    ["Jean 3:16:2", /illisibles/],
    ["J 3:16", /inconnu/],
  ])("%j", (input, message) => {
    const r = parseReference(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(message);
  });
});

describe("formatReference", () => {
  it.each([
    ["ps 34.8", "Psaume 34:8"],
    ["Ps 23", "Psaume 23"],
    ["Ps 23-24", "Psaumes 23-24"],
    ["jn 3 16-17", "Jean 3:16-17"],
    ["1co 13:4", "1 Corinthiens 13:4"],
    ["Jean 3:16-4:2", "Jean 3:16-4:2"],
    ["esaie 40:31", "Ésaïe 40:31"],
    ["Jean 3:16-16", "Jean 3:16"],
  ])("%s → %s", (input, expected) => expect(formatReference(parsed(input))).toBe(expected));
});
