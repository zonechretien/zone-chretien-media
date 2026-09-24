import { describe, expect, it } from "vitest";
import { frenchQuote, frenchTypography } from "./typography";

const NNBSP = "\u202F";
const NBSP = "\u00A0";

describe("frenchTypography", () => {
  it("ajoute une espace fine insécable avant ; ! ?", () => {
    expect(frenchTypography("bon! Qui? oui;")).toBe(`bon${NNBSP}! Qui${NNBSP}? oui${NNBSP};`);
  });

  it("remplace une espace ordinaire existante au lieu d'en ajouter une", () => {
    expect(frenchTypography("bon !")).toBe(`bon${NNBSP}!`);
  });

  it("ajoute une espace insécable avant les deux-points", () => {
    expect(frenchTypography("Dieu dit: Que")).toBe(`Dieu dit${NBSP}: Que`);
  });

  it("ne touche pas aux références chapitre:verset", () => {
    expect(frenchTypography("Psaume 34:8 et Jean 3:16-17")).toBe("Psaume 34:8 et Jean 3:16-17");
  });

  it("utilise l'apostrophe typographique", () => {
    expect(frenchTypography("l'Éternel")).toBe("l’Éternel");
  });

  it("est idempotente", () => {
    const once = frenchTypography("Il dit: bon! l'homme; vrai?");
    expect(frenchTypography(once)).toBe(once);
  });
});

describe("frenchQuote", () => {
  it("entoure de guillemets français avec espaces insécables", () => {
    expect(frenchQuote("Amen")).toBe(`«${NNBSP}Amen${NNBSP}»`);
  });
});
