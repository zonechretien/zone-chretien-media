import { describe, expect, it } from "vitest";
import { templateMeta } from "@reels/template-meta";
import {
  REEL_SOURCES,
  REEL_SOURCES_PENDING,
  clipToSentences,
  draftFromDevotion,
  draftFromPrayer,
  draftFromQuote,
  draftFromVerse,
  parseSourceFilter,
  sameBibleText,
  type ReelDraft,
} from "./sources";

/** Le brouillon doit être valide pour son template (sinon l'éditeur s'ouvrirait en erreur). */
function expectValid(d: ReelDraft) {
  const r = templateMeta(d.templateId).schema.safeParse(d.props);
  expect(r.success, r.success ? "" : r.error.issues[0]?.message).toBe(true);
  expect(d.title.length).toBeLessThanOrEqual(120);
}

describe("types de contenu", () => {
  it("chaque type est soit transformable, soit signalé en développement (jamais les deux)", () => {
    const all = ["VERSE", "DEVOTION", "PRAYER", "INSPIRATION", "TESTIMONY", "ARTICLE"] as const;
    for (const t of all) expect(Boolean(REEL_SOURCES[t]) !== Boolean(REEL_SOURCES_PENDING[t])).toBe(true);
  });

  it("templates utilisés", () => {
    expect(REEL_SOURCES.VERSE?.templateId).toBe("Verset");
    expect(REEL_SOURCES.DEVOTION?.templateId).toBe("Devotion");
    expect(REEL_SOURCES.PRAYER?.templateId).toBe("Priere");
    expect(REEL_SOURCES.INSPIRATION?.templateId).toBe("Citation");
    expect(REEL_SOURCES.TESTIMONY?.templateId).toBe("Citation");
  });
});

describe("brouillons préremplis", () => {
  it("verset du jour → Verset, référence mise en forme, LSG seulement si vérifié", () => {
    const verse = { reference: "psaume 34.8", text: "  Sentez et voyez combien l'Éternel est bon!  ", date: new Date("2026-09-23T00:00:00Z") };
    const d = draftFromVerse(verse, { formattedReference: "Psaume 34:8", isLsg1910: true });
    expectValid(d);
    expect(d.title).toBe("Verset du jour — Psaume 34:8 (23 septembre 2026)");
    expect(d.props).toMatchObject({ reference: "Psaume 34:8", text: "Sentez et voyez combien l'Éternel est bon!", showVersion: true });
    expect(draftFromVerse(verse, { formattedReference: null, isLsg1910: false }).props).toMatchObject({ reference: "psaume 34.8", showVersion: false });
  });

  it("dévotion → Dévotion : titre, verset, réflexion, appel à l'action", () => {
    const d = draftFromDevotion(
      { title: "Marcher par la foi", mainVerseRef: "2 Co 5:7", mainVerseText: "car nous marchons par la foi et non par la vue,", reflection: "Avance aujourd'hui avec confiance." },
      { formattedReference: "2 Corinthiens 5:7", isLsg1910: true },
    );
    expectValid(d);
    expect(d.templateId).toBe("Devotion");
    expect(d.props).toMatchObject({ title: "Marcher par la foi", verseReference: "2 Corinthiens 5:7", reflection: "Avance aujourd'hui avec confiance." });
  });

  it("prière → Prière, sans verset", () => {
    const d = draftFromPrayer({ title: "Prière pour la sagesse", content: "Seigneur, donne-moi ta sagesse. Amen." });
    expectValid(d);
    expect(d.props).toMatchObject({ title: "Prière pour la sagesse", verseReference: "", verseText: "" });
  });

  it("inspiration et témoignage → Citation, auteur par défaut « Zone-Chrétien »", () => {
    const i = draftFromQuote("INSPIRATION", { title: "Gratitude", text: "La gratitude change notre regard.", author: null });
    const t = draftFromQuote("TESTIMONY", { title: "Guérison", text: "Dieu m'a relevé.", author: "Marie" });
    expectValid(i);
    expectValid(t);
    expect(i.props).toMatchObject({ kicker: "Inspiration", author: "Zone-Chrétien" });
    expect(t.props).toMatchObject({ kicker: "Témoignage", author: "Marie" });
    expect(t.title).toBe("Témoignage — Guérison");
  });

  it("un texte trop long est raccourci pour rester valide", () => {
    const long = "Une phrase de témoignage assez longue pour remplir l'écran. ".repeat(40);
    expectValid(draftFromQuote("TESTIMONY", { title: "x".repeat(200), text: long, author: "y".repeat(200) }));
    expectValid(draftFromPrayer({ title: "t".repeat(200), content: long.repeat(2) }));
  });
});

describe("clipToSentences", () => {
  it("garde un texte court tel quel (espaces normalisés)", () => {
    expect(clipToSentences("  Bonjour\n le monde. ", 100)).toBe("Bonjour le monde.");
  });

  it("coupe après la dernière phrase complète", () => {
    expect(clipToSentences("Première phrase. Deuxième phrase. Troisième phrase trop longue.", 40)).toBe("Première phrase. Deuxième phrase.");
  });

  it("sinon coupe au dernier mot entier avec « … »", () => {
    const r = clipToSentences("un texte sans aucune ponctuation qui continue encore longtemps", 30);
    expect(r.endsWith("…")).toBe(true);
    expect(r.length).toBeLessThanOrEqual(30);
  });
});

describe("sameBibleText", () => {
  it("ignore casse, accents, ponctuation et espaces ; détecte une autre traduction", () => {
    expect(sameBibleText("Sentez et voyez combien l'Éternel est bon!", "sentez et voyez, combien l’eternel est bon !")).toBe(true);
    expect(sameBibleText("La charité est patiente", "L'amour est patient")).toBe(false);
    expect(sameBibleText("", "")).toBe(false);
  });
});

describe("parseSourceFilter", () => {
  it("lit un filtre valide et rejette le reste", () => {
    expect(parseSourceFilter("VERSE:cmuec43fq000014u39qjby384")).toEqual({ sourceType: "VERSE", sourceId: "cmuec43fq000014u39qjby384" });
    expect(parseSourceFilter("SONG:abc")).toBeNull();
    expect(parseSourceFilter("VERSE:a b")).toBeNull();
  });
});
