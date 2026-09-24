import { describe, expect, it } from "vitest";
import { computeSequenceTiming, readingSeconds } from "./timing";

const base = { fps: 30, introSeconds: 0.3, endCardSeconds: 2.5, minSegmentSeconds: 2.5 };

describe("readingSeconds", () => {
  it("reste dans les bornes 3,5 s – 14 s", () => {
    expect(readingSeconds(1)).toBe(3.5);
    expect(readingSeconds(500)).toBe(14);
  });
});

describe("computeSequenceTiming", () => {
  it("enchaîne intro, écrans et écran de fin sans trou", () => {
    const t = computeSequenceTiming({ ...base, segmentSeconds: [4, 6], durationSeconds: null });
    expect(t.segments[0].from).toBe(9);
    expect(t.segments[1].from).toBe(t.segments[0].from + t.segments[0].duration);
    expect(t.endCard.from).toBe(t.segments[1].from + t.segments[1].duration);
    expect(t.totalFrames).toBe(9 + 120 + 180 + 75);
  });

  it("respecte une durée imposée", () => {
    const t = computeSequenceTiming({ ...base, segmentSeconds: [4, 6], durationSeconds: 20 });
    expect(t.totalFrames).toBe(20 * 30);
  });

  it("ne descend jamais sous la durée minimale par écran", () => {
    const t = computeSequenceTiming({ ...base, segmentSeconds: [10, 10, 10], durationSeconds: 6 });
    for (const s of t.segments) expect(s.duration).toBeGreaterThanOrEqual(2.5 * 30);
  });
});

describe("durée imposée exacte à l'image près", () => {
  it("la somme des écrans tombe pile sur la durée demandée", () => {
    for (const d of [7, 12.3, 30, 61]) {
      const t = computeSequenceTiming({ ...base, segmentSeconds: [2.9, 4.1, 3.7, 5.3], durationSeconds: d });
      if (t.segments.every((s) => s.duration > 2.5 * 30)) expect(t.totalFrames).toBe(Math.round(d * 30));
    }
  });
});
