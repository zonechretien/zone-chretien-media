import { describe, expect, it } from "vitest";
import { formatEventDate, formatEventTime } from "../lib/dates";
import { TEMPLATE_METAS } from "../template-meta";
import { citationSpec, devotionSpec, evenementSpec, priereSpec, versetSpec } from "./specs";

const d = TEMPLATE_METAS;

describe("écrans de chaque template", () => {
  it("Verset : un texte entre guillemets, référence + LSG en pied persistant", () => {
    const spec = versetSpec(d.Verset.defaultProps("9:16"));
    expect(spec.persistentFooter).toBe("Psaume 34:8 · LSG 1910");
    expect(spec.screens).toEqual([{ blocks: [{ type: "body", text: expect.any(String), quote: true }] }]);
  });

  it("Prière : titre → prière → verset (facultatif)", () => {
    const p = d.Priere.defaultProps("9:16");
    expect(priereSpec(p).screens.map((s) => s.blocks.map((b) => b.type).join("+"))).toEqual(["heading", "body", "body"]);
    expect(priereSpec(p).screens[2].footer).toBe("Philippiens 4:6 · LSG 1910");
    expect(priereSpec({ ...p, verseReference: "", verseText: "" }).screens).toHaveLength(2);
  });

  it("Dévotion : titre → verset → réflexion → appel à l'action (si renseigné)", () => {
    const p = d.Devotion.defaultProps("9:16");
    expect(devotionSpec(p).screens.map((s) => s.blocks[0].type)).toEqual(["heading", "body", "body", "cta"]);
    expect(devotionSpec({ ...p, callToAction: " " }).screens).toHaveLength(3);
    expect(devotionSpec({ ...p, showVersion: false }).screens[1].footer).toBe("2 Corinthiens 12:9");
  });

  it("Citation : l'auteur en pied persistant", () => {
    expect(citationSpec(d.Citation.defaultProps("1:1")).persistentFooter).toBe("— Saint Augustin");
  });

  it("Événement : le nom au-dessus des détails, les écrans vides sont omis", () => {
    const p = d.Evenement.defaultProps("16:9");
    const types = (spec: ReturnType<typeof evenementSpec>) => spec.screens.map((s) => s.blocks.map((b) => b.type).join("+"));
    expect(types(evenementSpec(p))).toEqual(["heading+details", "body", "cta"]);
    const details = evenementSpec(p).screens[0].blocks[1];
    expect(details).toEqual({
      type: "details",
      items: [
        { icon: "date", text: "Samedi 17 octobre 2026" },
        { icon: "time", text: "19 h 30" },
        { icon: "place", text: "Église de la Grâce" },
      ],
    });
    const minimal = evenementSpec({ ...p, time: "", place: "", description: "", callToAction: "" });
    expect(types(minimal)).toEqual(["heading+details"]);
  });
});

describe("dates en français", () => {
  it.each([
    ["2026-10-17", "Samedi 17 octobre 2026"],
    ["2026-11-01", "Dimanche 1er novembre 2026"],
    ["2027-02-29", ""],
    ["2026-13-01", ""],
    ["hier", ""],
  ])("%s → %j", (iso, expected) => expect(formatEventDate(iso)).toBe(expected));

  it.each([
    ["19:30", "19 h 30"],
    ["09:00", "9 h"],
    ["20:05", "20 h 05"],
    ["", ""],
    ["25:00", ""],
  ])("%j → %j", (hhmm, expected) => expect(formatEventTime(hhmm)).toBe(expected));
});
