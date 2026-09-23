import { describe, expect, it } from "vitest";
import { versetSchema } from "@reels/schemas";
import { REEL_SOURCES, REEL_SOURCES_PENDING, draftFromDevotion, draftFromVerse, parseSourceFilter, sameBibleText } from "./sources";

describe("types de contenu", () => {
  it("chaque type est soit transformable, soit signalé en développement (jamais les deux)", () => {
    const all = ["VERSE", "DEVOTION", "PRAYER", "INSPIRATION", "TESTIMONY", "ARTICLE"] as const;
    for (const t of all) expect(Boolean(REEL_SOURCES[t]) !== Boolean(REEL_SOURCES_PENDING[t])).toBe(true);
  });
});

describe("draftFromVerse / draftFromDevotion", () => {
  const verse = { reference: "psaume 34.8", text: "  Sentez et voyez combien l'Éternel est bon!  ", date: new Date("2026-09-23T00:00:00Z") };

  it("préremplit un Reel Verset valide, avec la référence mise en forme", () => {
    const d = draftFromVerse(verse, { formattedReference: "Psaume 34:8", isLsg1910: true });
    expect(d.templateId).toBe("Verset");
    expect(d.title).toBe("Verset du jour — Psaume 34:8 (23 septembre 2026)");
    expect(d.props).toMatchObject({ reference: "Psaume 34:8", text: "Sentez et voyez combien l'Éternel est bon!", kicker: "Verset du jour", showVersion: true });
    expect(versetSchema.safeParse(d.props).success).toBe(true);
  });

  it("garde la référence saisie si elle n'a pas pu être analysée, et n'affiche pas LSG 1910", () => {
    const d = draftFromVerse({ ...verse, reference: "Ps 34 (version libre)" }, { formattedReference: null, isLsg1910: false });
    expect(d.props.reference).toBe("Ps 34 (version libre)");
    expect(d.props.showVersion).toBe(false);
  });

  it("dévotion : verset principal + titre du projet", () => {
    const d = draftFromDevotion(
      { title: "Marcher par la foi", mainVerseRef: "2 Co 5:7", mainVerseText: "car nous marchons par la foi et non par la vue," },
      { formattedReference: "2 Corinthiens 5:7", isLsg1910: true },
    );
    expect(d.title).toBe("Dévotion — Marcher par la foi");
    expect(d.props).toMatchObject({ reference: "2 Corinthiens 5:7", kicker: "Dévotion du jour" });
  });

  it("tronque un titre trop long à 120 caractères", () => {
    const d = draftFromDevotion({ title: "x".repeat(300), mainVerseRef: "Jn 3:16", mainVerseText: "t" }, { formattedReference: null, isLsg1910: false });
    expect(d.title.length).toBe(120);
  });
});

describe("sameBibleText", () => {
  it("ignore casse, accents, ponctuation et espaces", () => {
    expect(sameBibleText("Sentez et voyez combien l'Éternel est bon!", "sentez et voyez, combien l’eternel est bon !")).toBe(true);
  });

  it("détecte une autre traduction", () => {
    expect(sameBibleText("La charité est patiente", "L'amour est patient")).toBe(false);
    expect(sameBibleText("", "")).toBe(false);
  });
});

describe("parseSourceFilter", () => {
  it("lit un filtre valide et rejette le reste", () => {
    expect(parseSourceFilter("VERSE:cmuec43fq000014u39qjby384")).toEqual({ sourceType: "VERSE", sourceId: "cmuec43fq000014u39qjby384" });
    expect(parseSourceFilter("SONG:abc")).toBeNull();
    expect(parseSourceFilter("VERSE:a b")).toBeNull();
    expect(parseSourceFilter(undefined)).toBeNull();
  });
});
