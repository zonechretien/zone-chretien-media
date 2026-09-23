import { describe, expect, it } from "vitest";
import { fitText, paginateText, wordCount, wrapLines, type PaginateOptions } from "./text-fit";

const opts: PaginateOptions = {
  maxWidth: 780,
  maxHeight: 830,
  maxFontSize: 88,
  minFontSize: 50,
  readableFontSize: 58,
  maxWordsPerPage: 26,
  lineHeight: 1.34,
};

/** Vérifie qu'un écran tient dans la boîte à la taille donnée. */
function pageFits(page: string, fontSize: number, o: PaginateOptions) {
  const lines = wrapLines(page, fontSize, o.maxWidth);
  return lines !== null && lines.length * fontSize * o.lineHeight <= o.maxHeight;
}

const LONG =
  "La charité est patiente, elle est pleine de bonté; la charité n'est point envieuse; la charité ne se vante point, elle ne s'enfle point d'orgueil, elle ne fait rien de malhonnête, elle ne cherche point son intérêt, elle ne s'irrite point, elle ne soupçonne point le mal, elle ne se réjouit point de l'injustice, mais elle se réjouit de la vérité; elle excuse tout, elle croit tout, elle espère tout, elle supporte tout.";

describe("wrapLines", () => {
  it("ne coupe jamais sur une espace insécable", () => {
    const lines = wrapLines("mot\u202F! mot\u00A0: fin", 80, 400)!;
    expect(lines.some((l) => l.startsWith("!") || l.startsWith(":"))).toBe(false);
  });

  it("renvoie null si un mot seul est trop large", () => {
    expect(wrapLines("Anticonstitutionnellement", 100, 300)).toBeNull();
  });
});

describe("fitText", () => {
  it("garde la taille maximale pour un texte court", () => {
    expect(fitText("Dieu est amour.", opts)!.fontSize).toBe(opts.maxFontSize);
  });

  it("réduit la taille pour un texte plus long sans descendre sous le minimum", () => {
    const fit = fitText("Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point.", opts)!;
    expect(fit.fontSize).toBeLessThanOrEqual(opts.maxFontSize);
    expect(fit.fontSize).toBeGreaterThanOrEqual(opts.minFontSize);
  });
});

describe("paginateText", () => {
  it("un seul écran pour un verset court", () => {
    const p = paginateText("Je puis tout par celui qui me fortifie.", opts);
    expect(p.pages).toHaveLength(1);
  });

  it("découpe un texte long en écrans lisibles, équilibrés, sans perdre un mot", () => {
    const p = paginateText(LONG, opts);
    expect(p.pages.length).toBeGreaterThan(1);
    expect(p.pages.join(" ")).toBe(LONG);
    expect(p.fontSize).toBeGreaterThanOrEqual(opts.readableFontSize);
    const counts = p.pages.map(wordCount);
    for (const c of counts) expect(c).toBeLessThanOrEqual(opts.maxWordsPerPage);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(8);
    for (const page of p.pages) expect(pageFits(page, p.fontSize, opts)).toBe(true);
  });

  it("coupe de préférence après une ponctuation", () => {
    const p = paginateText(LONG, opts);
    for (const page of p.pages.slice(0, -1)) expect(page).toMatch(/[,;.!?:]$/);
  });

  it("gère une phrase sans ponctuation plus longue qu'un écran", () => {
    const text = Array.from({ length: 70 }, (_, i) => `mot${i}`).join(" ");
    const p = paginateText(text, opts);
    expect(p.pages.join(" ")).toBe(text);
    for (const page of p.pages) expect(pageFits(page, p.fontSize, opts)).toBe(true);
  });
});
