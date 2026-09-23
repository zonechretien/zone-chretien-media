import { describe, expect, it } from "vitest";
import { lookupPassage } from "./lsg1910";

function text(input: string) {
  const r = lookupPassage(input);
  if (!r.ok) throw new Error(`${input} → ${r.error}`);
  return r.passage;
}

describe("lookupPassage (LSG 1910 hors ligne)", () => {
  it("Psaume 34:8", () => {
    expect(text("Ps 34.8")).toEqual({
      reference: "Psaume 34:8",
      text: "Sentez et voyez combien l'Éternel est bon! Heureux l'homme qui cherche en lui son refuge!",
      verseCount: 1,
      includesPsalmTitle: false,
    });
  });

  it("Jean 3:16-17 (deux versets réunis)", () => {
    const p = text("Jean 3:16-17");
    expect(p.verseCount).toBe(2);
    expect(p.text).toMatch(/^Car Dieu a tant aimé le monde .* vie éternelle\. Dieu, en effet, n'a pas envoyé son Fils/);
  });

  it("1 Co 13:4 — texte de 1910 (« La charité », pas « L'amour »)", () => {
    expect(text("1 Co 13:4").text).toMatch(/^La charité est patiente/);
  });

  it("passage sur deux chapitres", () => {
    const p = text("Jean 3:36-4:1");
    expect(p.verseCount).toBe(2);
    expect(p.reference).toBe("Jean 3:36-4:1");
  });

  it("signale le titre inclus au verset 1 d'un psaume", () => {
    expect(text("Psaume 23").includesPsalmTitle).toBe(true);
    expect(text("Psaume 23:1").text).toMatch(/^Cantique de David\./);
    expect(text("Psaume 23:4").includesPsalmTitle).toBe(false);
  });

  it.each([
    ["Jude 2:1", /chapitre 2 n'existe pas/],
    ["Jean 3:99", /n'a que 36 versets/],
    ["Livre 1:1", /inconnu/],
  ])("erreur claire : %s", (input, message) => {
    const r = lookupPassage(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(message);
  });
});

describe("versets d'exemple des templates", () => {
  it("sont exactement le texte LSG 1910 (ils s'affichent avec « LSG 1910 »)", async () => {
    const { TEMPLATE_METAS } = await import("@reels/template-meta");
    const { sameBibleText } = await import("@/lib/reels/sources");
    const samples: [string, string][] = [
      [TEMPLATE_METAS.Verset.defaultProps("9:16").reference, TEMPLATE_METAS.Verset.defaultProps("9:16").text],
      [TEMPLATE_METAS.Priere.defaultProps("9:16").verseReference, TEMPLATE_METAS.Priere.defaultProps("9:16").verseText],
      [TEMPLATE_METAS.Devotion.defaultProps("9:16").verseReference, TEMPLATE_METAS.Devotion.defaultProps("9:16").verseText],
    ];
    for (const [ref, sample] of samples) {
      const r = lookupPassage(ref);
      if (!r.ok) throw new Error(r.error);
      expect(sameBibleText(r.passage.text, sample), ref).toBe(true);
    }
  });
});
