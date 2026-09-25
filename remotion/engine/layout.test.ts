import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORMAT_IDS, type FormatId } from "../formats";
import { wordCount } from "../lib/text-fit";
import { TEMPLATE_METAS, layoutFor, templateMeta, type AnyTemplateProps, type TemplateId } from "../template-meta";
import { halfLeading, referenceMargin, screenHeight, type ReelLayout } from "./layout";

type Bible = { books: { name: string; chapters: { number: number; verses: { number: number; text: string }[] }[] }[] };
const bible = JSON.parse(fs.readFileSync(path.join(__dirname, "../../prisma/bible-data/lsg1910.json"), "utf8")) as Bible;
const verses = bible.books.flatMap((b) =>
  b.chapters.flatMap((c) => c.verses.map((v) => ({ reference: `${b.name} ${c.number}:${v.number}`, text: v.text }))),
);
const longest = [...verses].sort((a, b) => b.text.length - a.text.length).slice(0, 300);

const IDS = Object.keys(TEMPLATE_METAS) as TemplateId[];

/** Vérifie qu'aucun écran ne déborde et que chaque écran reste lisible. */
function expectFits(L: ReelLayout, label: string) {
  for (const [i, screen] of L.screens.entries()) {
    expect(screenHeight(screen, L), `${label} — écran ${i + 1} déborde`).toBeLessThanOrEqual(L.stageHeight + 0.5);
    for (const b of screen.blocks) {
      if (b.type === "body") expect(wordCount(b.text), `${label} — trop de mots`).toBeLessThanOrEqual(L.sizes.maxWords);
    }
  }
  expect(L.timing.segments).toHaveLength(L.screens.length);
  // Tout le bloc (en-tête, écrans, pied) reste dans la zone sûre.
  expect(L.group.top, `${label} — trop haut`).toBeGreaterThanOrEqual(L.box.y);
  expect(L.group.top + L.group.height, `${label} — trop bas`).toBeLessThanOrEqual(L.box.y + L.box.height + 0.5);
}

function withProps(id: TemplateId, format: FormatId, patch: Partial<Record<string, unknown>>): AnyTemplateProps {
  const meta = templateMeta(id);
  const props = { ...meta.defaultProps(format), ...patch };
  const parsed = meta.schema.safeParse(props);
  if (!parsed.success) throw new Error(`${id} : props de test invalides — ${parsed.error.issues[0]?.message}`);
  return parsed.data;
}

describe("valeurs par défaut de chaque template, dans chaque format", () => {
  for (const id of IDS) {
    for (const format of FORMAT_IDS) {
      it(`${id} ${format}`, () => {
        const meta = templateMeta(id);
        expect(meta.formats).toContain(format);
        const L = layoutFor(meta, withProps(id, format, {}));
        expectFits(L, `${id} ${format}`);
        expect([L.width, L.height]).toEqual(format === "9:16" ? [1080, 1920] : format === "1:1" ? [1080, 1080] : [1920, 1080]);
      });
    }
  }
});

describe("textes à la longueur maximale autorisée", () => {
  const long = (n: number) => {
    const words = "Seigneur, tu es ma lumière et mon salut; je marche avec confiance devant ta face, car ta grâce me suffit.".split(" ");
    let s = "";
    for (let i = 0; s.length < n; i++) s += (s ? " " : "") + words[i % words.length];
    return s.slice(0, n).trim();
  };
  const cases: [TemplateId, Record<string, unknown>][] = [
    ["Priere", { title: long(80), text: long(1500), verseReference: "Philippiens 4:6-7", verseText: long(600), kicker: long(40) }],
    ["Devotion", { title: long(80), verseText: long(600), reflection: long(1200), callToAction: long(60), kicker: long(40) }],
    ["Citation", { quote: long(800), author: long(60), kicker: long(40) }],
    ["Evenement", { name: long(80), place: long(80), description: long(400), callToAction: long(60), date: "2026-09-30", time: "20:45" }],
    ["Verset", { text: long(1500), reference: long(60), kicker: long(40) }],
  ];
  for (const [id, patch] of cases) {
    for (const format of FORMAT_IDS) {
      it(`${id} ${format}`, () => expectFits(layoutFor(templateMeta(id), withProps(id, format, patch)), `${id} ${format}`));
    }
  }
});

describe("les 300 versets les plus longs de la LSG 1910 (template Verset)", () => {
  for (const format of FORMAT_IDS) {
    it(`format ${format}`, () => {
      for (const v of longest) {
        expectFits(layoutFor(templateMeta("Verset"), withProps("Verset", format, v)), `${v.reference} ${format}`);
      }
    });
  }
});

describe("durée", () => {
  it("calée sur la voix off quand c'est demandé", () => {
    const props = withProps("Citation", "9:16", {
      voiceOver: { path: "VoixOff/v.m4a", volume: 1, startSeconds: 0.5, mediaDurationSeconds: 12, musicDuckVolume: 0.25, fitDuration: true },
    });
    expect(layoutFor(templateMeta("Citation"), props).timing.totalFrames).toBe(Math.round((0.5 + 12 + 0.8 + 2.5) * 30));
  });

  it("imposée par l'utilisateur", () => {
    const L = layoutFor(templateMeta("Devotion"), withProps("Devotion", "1:1", { durationSeconds: 30 }));
    expect(L.timing.totalFrames).toBe(30 * 30);
  });

  it("accroche : le premier écran commence dans la première demi-seconde", () => {
    for (const id of IDS) expect(layoutFor(templateMeta(id), withProps(id, "9:16", {})).timing.segments[0].from).toBeLessThan(15);
  });
});

describe("placement vertical", () => {
  it("un contenu court est centré sur l'image (9:16)", () => {
    const L = layoutFor(templateMeta("Citation"), withProps("Citation", "9:16", { quote: "Dieu est amour.", author: "1 Jean 4:8" }));
    const center = L.group.top + L.group.height / 2;
    expect(Math.abs(center - L.height / 2)).toBeLessThanOrEqual(1);
  });

  it("un contenu long remplit la zone sûre sans en sortir", () => {
    const L = layoutFor(templateMeta("Verset"), withProps("Verset", "9:16", { reference: longest[0].reference, text: longest[0].text }));
    expect(L.group.top).toBeGreaterThanOrEqual(L.box.y);
    expect(L.group.top + L.group.height).toBeLessThanOrEqual(L.box.y + L.box.height + 0.5);
  });
});

describe("écart entre le texte et sa référence", () => {
  /** Espace visible entre le bas des lettres du texte et le haut du libellé. */
  const visibleGap = (L: ReelLayout) => {
    const body = L.screens.at(-1)!.blocks.at(-1)!;
    const footer = L.persistentFooter ?? L.screens.at(-1)!.footer!;
    return referenceMargin(L, body, footer.fontSize) + halfLeading(body) + 0.15 * footer.fontSize;
  };
  const short = "Dieu est amour.";
  const long = longest[0].text;

  for (const format of FORMAT_IDS) {
    it(`identique pour un texte court ou long, et d'un template à l'autre (${format})`, () => {
      const gaps = [
        layoutFor(templateMeta("Verset"), withProps("Verset", format, { text: short })),
        layoutFor(templateMeta("Verset"), withProps("Verset", format, { text: long })),
        layoutFor(templateMeta("Citation"), withProps("Citation", format, { quote: short })),
        layoutFor(templateMeta("Priere"), withProps("Priere", format, { verseReference: "Jean 3:16", verseText: long.slice(0, 280) })),
        layoutFor(templateMeta("Devotion"), withProps("Devotion", format, { verseText: short, callToAction: "" })),
      ].map((L) => (L.persistentFooter ? visibleGap(L) : visibleGapOfVerseScreen(L)));
      for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 6);
    });
  }

  /** Prière / Dévotion : la référence suit le verset sur son propre écran. */
  function visibleGapOfVerseScreen(L: ReelLayout) {
    const screen = L.screens.find((s) => s.footer)!;
    const body = screen.blocks.at(-1)!;
    return referenceMargin(L, body, screen.footer!.fontSize) + halfLeading(body) + 0.15 * screen.footer!.fontSize;
  }
});
