import { describe, expect, it } from "vitest";
import { templateMeta } from "../../template-meta";
import type { PriereProps, VoiceOverProps } from "../../schemas";
import { SYNC_CONFIDENCE_OK, syncQuality, weakSentences } from "./quality";
import { narrationScript } from "./script";
import { SCREEN_LEAD_FRAMES, activeSync, computeSyncedTiming, voiceFrame } from "./timing";

const screens = [
  { blocks: [{ type: "heading" as const, text: "Prière" }] },
  { blocks: [{ type: "body" as const, text: "Merci Seigneur. Garde-nous." }] },
];
const script = narrationScript(screens);
// Mots : Prière | Merci Seigneur. | Garde-nous.
const words: [number, number][] = [[2, 2.5], [4, 4.4], [4.5, 5.1], [6, 6.8]];

const voice = (over: Partial<VoiceOverProps> = {}): VoiceOverProps => ({
  path: "VoixOff/v.m4a",
  volume: 1,
  startSeconds: 0.5,
  mediaDurationSeconds: 8,
  musicDuckVolume: 0.25,
  fitDuration: true,
  pitchSemitones: 0,
  textStyle: "phrase",
  sync: { source: "auto", audioPath: "VoixOff/v.m4a", scriptHash: script.hash, trimStartSeconds: 1.5, words, confidence: 0.9, model: "small", weakSentences: [] },
  ...over,
});

describe("synchronisation valable", () => {
  it("même voix et même texte", () => expect(activeSync(voice(), script)).not.toBeNull());
  it("ignorée si la voix a changé", () => expect(activeSync(voice({ path: "VoixOff/autre.m4a" }), script)).toBeNull());
  it("ignorée si le texte a changé", () => {
    const other = narrationScript([{ blocks: [{ type: "heading", text: "Autre titre" }] }]);
    expect(activeSync(voice(), other)).toBeNull();
  });
});

describe("minutage synchronisé", () => {
  const fps = 30;
  const t = computeSyncedTiming({ voice: voice(), sync: voice().sync!, script, screenCount: 2, fps, introSeconds: 0.3, endCardSeconds: 2.5 });

  it("silence du début retiré : un mot à 2 s du fichier est entendu à 0,5 + 0,5 s", () => {
    expect(voiceFrame({ startSeconds: 0.5 }, { trimStartSeconds: 1.5 }, 2, fps)).toBe(30);
  });

  it("chaque écran commence juste avant son premier mot", () => {
    expect(t.timing.segments[0].from).toBe(9);
    expect(t.timing.segments[1].from).toBe(voiceFrame({ startSeconds: 0.5 }, { trimStartSeconds: 1.5 }, 4, fps) - SCREEN_LEAD_FRAMES);
  });

  it("écran de fin après le dernier mot, durée totale cohérente", () => {
    const lastEnd = voiceFrame({ startSeconds: 0.5 }, { trimStartSeconds: 1.5 }, 6.8, fps);
    expect(t.timing.endCard.from).toBe(lastEnd + 24);
    expect(t.timing.totalFrames).toBe(t.timing.endCard.from + 75);
    const segs = t.timing.segments;
    expect(segs[0].from + segs[0].duration).toBe(segs[1].from);
    expect(segs[1].from + segs[1].duration).toBe(t.timing.endCard.from);
  });

  it("style phrase : la phrase entière apparaît quand elle commence", () => {
    // « Merci » et « Seigneur. » : même phrase, même apparition.
    expect(t.words[1].reveal).toBe(t.words[2].reveal);
    expect(t.words[3].reveal).toBeGreaterThan(t.words[2].reveal);
  });

  it("style mot : tout l'écran visible dès son début, chaque mot surligné à son heure", () => {
    const m = computeSyncedTiming({ voice: voice({ textStyle: "mot" }), sync: voice().sync!, script, screenCount: 2, fps, introSeconds: 0.3, endCardSeconds: 2.5 });
    expect(m.words[1].reveal).toBe(m.timing.segments[1].from);
    expect(m.words[3].reveal).toBe(m.timing.segments[1].from);
    expect(m.words[2].start).toBeGreaterThan(m.words[1].start);
  });
});

describe("Reel complet (template Prière)", () => {
  it("la durée suit la voix synchronisée, et reprend le minutage estimé si le texte change", () => {
    const meta = templateMeta("Priere");
    const props = { ...meta.defaultProps("9:16"), title: "Prière", text: "Merci Seigneur. Garde-nous.", verseReference: "", verseText: "" } as PriereProps;
    const layout = meta.metadata({ ...props, voiceOver: voice() });
    expect(layout.durationInFrames).toBe(Math.round((0.5 + 6.8 - 1.5) * 30) + 24 + 75);
    const changed = meta.metadata({ ...props, text: "Merci Seigneur.", voiceOver: voice() });
    expect(changed.durationInFrames).not.toBe(layout.durationInFrames);
  });
});

describe("qualité", () => {
  it("phrases mal reconnues", () => {
    // Phrase 0 : « Prière » retrouvé ; phrase 1 : aucun mot ; phrase 2 : retrouvé.
    expect(weakSentences([1, 0, 0, 0.9], script.sentences)).toEqual([1]);
  });
  it("niveaux", () => {
    expect(syncQuality(SYNC_CONFIDENCE_OK - 0.01, 0)).toBe("faible");
    expect(syncQuality(0.7, 0)).toBe("a-verifier");
    expect(syncQuality(0.95, 1)).toBe("a-verifier");
    expect(syncQuality(0.95, 0)).toBe("bonne");
  });
});
