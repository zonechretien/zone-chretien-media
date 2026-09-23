import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORMAT_IDS } from "../formats";
import { wordCount, wrapLines } from "../lib/text-fit";
import type { VersetProps } from "../schemas";
import { LINE_HEIGHT, computeVersetLayout } from "./verset-layout";

type Bible = { books: { name: string; chapters: { number: number; verses: { number: number; text: string }[] }[] }[] };

const bible = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../prisma/bible-data/lsg1910.json"), "utf8"),
) as Bible;

const verses = bible.books.flatMap((b) =>
  b.chapters.flatMap((c) => c.verses.map((v) => ({ reference: `${b.name} ${c.number}:${v.number}`, text: v.text }))),
);
// Les 300 versets les plus longs de la LSG 1910 : le pire cas réel.
const longest = [...verses].sort((a, b) => b.text.length - a.text.length).slice(0, 300);

function props(v: { reference: string; text: string }, format: VersetProps["format"]): VersetProps {
  return {
    format,
    background: { type: "gradient", from: "#16335F", to: "#050E1F" },
    durationSeconds: null,
    kicker: "Parole du jour",
    reference: v.reference,
    text: v.text,
    showVersion: true,
    music: null,
    voiceOver: null,
  };
}

describe("computeVersetLayout — aucun débordement sur les versets les plus longs", () => {
  for (const format of FORMAT_IDS) {
    it(`format ${format}`, () => {
      for (const v of longest) {
        const L = computeVersetLayout(props(v, format));
        const { fontSize, pages } = L.pagination;
        for (const page of pages) {
          const lines = wrapLines(page, fontSize, L.box.width);
          expect(lines, `${v.reference} : mot trop large`).not.toBeNull();
          expect(lines!.length * fontSize * LINE_HEIGHT, `${v.reference} déborde`).toBeLessThanOrEqual(L.textAreaHeight);
          expect(wordCount(page)).toBeLessThanOrEqual(L.sizes.maxWords);
        }
        expect(L.timing.segments).toHaveLength(pages.length);
      }
    });
  }
});

describe("computeVersetLayout", () => {
  it("donne les dimensions du format", () => {
    const L = computeVersetLayout(props(verses[0], "9:16"));
    expect([L.width, L.height]).toEqual([1080, 1920]);
  });

  it("réduit une référence très longue pour qu'elle tienne sur une ligne", () => {
    const L = computeVersetLayout({ ...props(verses[0], "9:16"), reference: "1 Thessaloniciens 5:16-18, 23-24 et 2 Thessaloniciens 3" });
    expect(L.referenceSize).toBeLessThan(L.sizes.reference);
  });
});

describe("durée calée sur la voix off", () => {
  it("la vidéo dure début + voix + pause + écran de fin", () => {
    const base = props(verses[0], "9:16");
    const L = computeVersetLayout({
      ...base,
      voiceOver: { path: "VoixOff/v.webm", volume: 1, startSeconds: 0.5, mediaDurationSeconds: 12, musicDuckVolume: 0.25, fitDuration: true },
    });
    expect(L.timing.totalFrames).toBe(Math.round((0.5 + 12 + 0.8 + 2.5) * 30));
  });
});
