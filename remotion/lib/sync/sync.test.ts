import { describe, expect, it } from "vitest";
import { alignScript, type RecognizedWord } from "./align";
import { retimeFromSentences, sentenceStarts } from "./manual";
import { normalizeTokens, similarity } from "./normalize";
import { numberToWords } from "./numbers";
import { narrationScript, scriptHash } from "./script";

/** Mots reconnus réguliers : un mot toutes les 0,4 s à partir de `from`. */
function spoken(text: string, from = 1, step = 0.4): RecognizedWord[] {
  return text.split(" ").map((w, i) => ({ text: w, start: from + i * step, end: from + i * step + step * 0.8 }));
}
const speech = { start: 0, end: 60 };

describe("nombres en toutes lettres", () => {
  it("français", () => {
    expect(numberToWords(16, "fr")).toEqual(["seize"]);
    expect(numberToWords(21, "fr")).toEqual(["vingt", "et", "un"]);
    expect(numberToWords(71, "fr")).toEqual(["soixante", "et", "onze"]);
    expect(numberToWords(80, "fr")).toEqual(["quatre", "vingts"]);
    expect(numberToWords(97, "fr")).toEqual(["quatre", "vingt", "dix", "sept"]);
    expect(numberToWords(150, "fr")).toEqual(["cent", "cinquante"]);
    expect(numberToWords(2026, "fr")).toEqual(["deux", "mille", "vingt", "six"]);
  });
  it("créole haïtien", () => {
    expect(numberToWords(3, "ht")).toEqual(["twa"]);
    expect(numberToWords(16, "ht")).toEqual(["sèz"]);
    expect(numberToWords(21, "ht")).toEqual(["venteyen"]);
    expect(numberToWords(23, "ht")).toEqual(["venntwa"]);
    expect(numberToWords(72, "ht")).toEqual(["swasanndouz"]);
    expect(numberToWords(80, "ht")).toEqual(["katreven"]);
    expect(numberToWords(91, "ht")).toEqual(["katrevenonz"]);
    expect(numberToWords(119, "ht")).toEqual(["san", "diznèf"]);
  });
  it("refuse les valeurs hors limites", () => {
    expect(numberToWords(-1, "fr")).toBeNull();
    expect(numberToWords(1_000_000, "fr")).toBeNull();
  });
});

describe("normalisation", () => {
  it("accents, apostrophes et ponctuation", () => {
    expect(normalizeTokens("l’Éternel", "fr")).toEqual(["l", "eternel"]);
    expect(normalizeTokens("« Sentez", "fr")).toEqual(["sentez"]);
    expect(normalizeTokens("bon !", "fr")).toEqual(["bon"]);
    expect(normalizeTokens("M’ap", "ht")).toEqual(["m", "ap"]);
  });
  it("références bibliques et chiffres", () => {
    expect(normalizeTokens("3:16", "fr")).toEqual(["trois", "seize"]);
    expect(normalizeTokens("3:16", "ht")).toEqual(["twa", "sez"]);
    expect(normalizeTokens("34:8-10", "fr")).toEqual(["trente", "quatre", "huit", "dix"]);
  });
  it("ressemblance", () => {
    expect(similarity("eternel", "eternel")).toBe(1);
    expect(similarity("eternel", "eternelle")).toBeGreaterThan(0.7);
    expect(similarity("bon", "maison")).toBeLessThan(0.5);
  });
});

describe("alignement sur le texte exact", () => {
  it("texte lu à l'identique : chaque mot prend son minutage", () => {
    const script = "Car Dieu a tant aimé le monde".split(" ");
    const a = alignScript(script, spoken("car dieu a tant aimé le monde"), { language: "fr", speech });
    expect(a.confidence).toBe(1);
    expect(a.words.map((w) => w.start)).toEqual([1, 1.4, 1.8, 2.2, 2.6, 3, 3.4]);
  });

  it("erreurs de reconnaissance : le texte reste juste, le minutage suit", () => {
    const script = "Heureux l’homme qui cherche en lui son refuge".split(" ");
    const a = alignScript(script, spoken("Heureux l'homme qui cherchent en lui sont refuges"), { language: "fr", speech });
    expect(a.confidence).toBeGreaterThan(0.85);
    expect(a.words[3].start).toBeCloseTo(1.8 + 0.4, 5); // « cherche » ≈ « cherchent »
  });

  it("référence lue en toutes lettres, en français", () => {
    const script = "Jean 3:16".split(" ");
    const a = alignScript(script, spoken("Jean trois seize"), { language: "fr", speech });
    expect(a.confidence).toBe(1);
    expect(a.words[1].start).toBe(1.4);
    expect(a.words[1].end).toBeCloseTo(2.12, 5);
  });

  it("référence lue en toutes lettres, en créole", () => {
    const a = alignScript("Jan 3:16".split(" "), spoken("Jan twa sèz"), { language: "ht", speech });
    expect(a.confidence).toBe(1);
  });

  it("chiffres écrits par Whisper à la place des mots", () => {
    const a = alignScript("Jean trois seize".split(" "), spoken("Jean 3 16"), { language: "fr", speech });
    expect(a.confidence).toBe(1);
  });

  it("mots ajoutés à l'oral (« Amen ») ignorés", () => {
    const script = "Que ta volonté soit faite".split(" ");
    const a = alignScript(script, spoken("Que ta volonté soit faite Amen amen"), { language: "fr", speech });
    expect(a.confidence).toBe(1);
    expect(a.words[4].start).toBe(2.6);
  });

  it("mot non lu : placé entre ses voisins, sans faire baisser les autres", () => {
    const script = "Le Seigneur est mon berger".split(" ");
    const a = alignScript(script, spoken("Le Seigneur mon berger"), { language: "fr", speech });
    expect(a.words[2].match).toBe(0);
    expect(a.words[2].start).toBeGreaterThanOrEqual(a.words[1].end);
    expect(a.words[2].end).toBeLessThanOrEqual(a.words[3].start);
    expect(a.confidence).toBeGreaterThan(0.75);
  });

  it("mot coupé en deux par Whisper", () => {
    const a = alignScript("Bondye renmen lanmou".split(" "), spoken("Bondye renmen lan mou"), { language: "ht", speech });
    expect(a.words[2].match).toBeGreaterThan(0.9);
    expect(a.words[2].start).toBe(1.8);
    expect(a.words[2].end).toBeCloseTo(2.52, 5);
  });

  it("voix sans rapport avec le texte : confiance très faible", () => {
    const script = "Heureux l’homme qui cherche en lui son refuge".split(" ");
    const a = alignScript(script, spoken("bonjour à tous merci de votre écoute"), { language: "fr", speech });
    expect(a.confidence).toBeLessThan(0.3);
    // Minutage toujours croissant, même sans repère.
    a.words.slice(1).forEach((w, i) => expect(w.start).toBeGreaterThanOrEqual(a.words[i].start));
  });

  it("aucun mot reconnu : répartition sur la durée de la parole, confiance nulle", () => {
    const a = alignScript(["Un", "deux"], [], { language: "fr", speech: { start: 1, end: 3 } });
    expect(a.confidence).toBe(0);
    expect(a.words[0].start).toBe(1);
    expect(a.words[1].end).toBe(3);
  });
});

describe("texte lu", () => {
  const screens = [
    { blocks: [{ type: "heading" as const, text: "Prière du matin" }] },
    { blocks: [{ type: "body" as const, text: "Seigneur, merci pour ce jour. Garde-moi ! Amen." }] },
    { blocks: [{ type: "details" as const, items: [{ text: "Samedi 12 octobre" }, { text: "19 h 30" }] }, { type: "cta" as const, text: "Rejoins-nous" }] },
  ];

  it("mots dans l'ordre des écrans, phrases découpées", () => {
    const s = narrationScript(screens);
    expect(s.words.map((w) => w.text).join(" ")).toBe("Prière du matin Seigneur, merci pour ce jour. Garde-moi ! Amen. Samedi 12 octobre 19 h 30 Rejoins-nous");
    expect(s.sentences.map((x) => x.text)).toEqual(["Prière du matin", "Seigneur, merci pour ce jour.", "Garde-moi !", "Amen.", "Samedi 12 octobre", "19 h 30", "Rejoins-nous"]);
    const cta = s.words.at(-1)!;
    expect([cta.screen, cta.block, cta.index]).toEqual([2, 1, 0]);
    const time = s.words.find((w) => w.text === "30")!;
    expect([time.block, time.index]).toEqual([0, 5]);
  });

  it("empreinte : identique pour le même texte, différente dès qu'un mot change", () => {
    expect(scriptHash(["a", "b"])).toBe(scriptHash(["a", "b"]));
    expect(scriptHash(["a", "b"])).not.toBe(scriptHash(["a", "c"]));
    expect(scriptHash(["ab"])).not.toBe(scriptHash(["a", "b"]));
  });
});

describe("calage manuel", () => {
  const scriptWords = ["Un", "deux.", "Trois", "quatre."];
  const sentences = [
    { first: 0, last: 1, text: "Un deux." },
    { first: 2, last: 3, text: "Trois quatre." },
  ];

  it("sans minutage automatique : mots répartis au débit ordinaire", () => {
    const w = retimeFromSentences({ scriptWords, sentences, starts: [1, 5], speechEnd: 8, base: null });
    expect(w[0][0]).toBe(1);
    expect(w[2][0]).toBe(5);
    expect(w[1][1]).toBeLessThanOrEqual(4.95);
    expect(sentenceStarts(w, sentences)).toEqual([1, 5]);
  });

  it("avec minutage automatique : rythme conservé, phrase déplacée", () => {
    const base: [number, number][] = [[1, 1.3], [1.4, 1.8], [2, 2.5], [2.6, 3]];
    const w = retimeFromSentences({ scriptWords, sentences, starts: [1.2, 2.5], speechEnd: 8, base });
    expect(w[0]).toEqual([1.2, 1.5]);
    expect(w[1]).toEqual([1.6, 2]);
    expect(w[2]).toEqual([2.5, 3]);
  });

  it("phrase trop longue pour la place : resserrée, jamais sur la suivante", () => {
    const base: [number, number][] = [[1, 2], [2, 3], [3, 4], [4, 5]];
    const w = retimeFromSentences({ scriptWords, sentences, starts: [1, 2.05], speechEnd: 8, base });
    expect(w[1][1]).toBeLessThanOrEqual(2);
  });
});
