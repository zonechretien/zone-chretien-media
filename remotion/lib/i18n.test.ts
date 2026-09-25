import { describe, expect, it } from "vitest";
import { TEMPLATE_METAS } from "../template-meta";
import { devotionSpec, evenementSpec, versetSpec } from "../templates/specs";
import { LABELS, formatEventDate, formatEventTime, translateDefaultLabels } from "./i18n";

describe("libellés validés", () => {
  it("créole haïtien (relu par Zone-Chrétien)", () => {
    expect(LABELS.ht.kickerVerset).toBe("Pawòl jounen an");
    expect(LABELS.ht.kickerVersetDuJour).toBe("Vèsè jounen an");
    expect(LABELS.ht.kickerDevotion).toBe("Devosyon jounen an");
    expect(LABELS.ht.kickerPriere).toBe("Ann priye ansanm");
    expect(LABELS.ht.ctaDevotion).toBe("Li devosyon an sou zone-chretien.org");
  });
  it("mêmes clés dans les deux langues", () => {
    expect(Object.keys(LABELS.ht).sort()).toEqual(Object.keys(LABELS.fr).sort());
  });
});

describe("dates et heures", () => {
  it.each([
    ["2026-10-17", "Samdi 17 oktòb 2026"],
    ["2026-08-01", "Samdi 1ye out 2026"],
    ["2026-12-25", "Vandredi 25 desanm 2026"],
    ["2026-02-30", ""],
  ])("créole : %s → %j", (iso, expected) => expect(formatEventDate(iso, "ht")).toBe(expected));

  it("français inchangé", () => {
    expect(formatEventDate("2026-10-17")).toBe("Samedi 17 octobre 2026");
    expect(formatEventTime("19:30")).toBe("19 h 30");
  });

  it.each([
    ["19:30", "7è30 nan aswè"],
    ["18:00", "6è nan aswè"],
    ["23:05", "11è05 nan aswè"],
    ["09:00", "9 h"],
    ["15:45", "15 h 45"],
    ["", ""],
  ])("créole : %j → %j", (hhmm, expected) => expect(formatEventTime(hhmm, "ht")).toBe(expected));
});

describe("changement de langue d'un projet", () => {
  it("libellés par défaut traduits", () => {
    const d = translateDefaultLabels({ kicker: "Dévotion du jour", callToAction: "Lis la dévotion sur zone-chretien.org", title: "Ma grâce" }, "fr", "ht");
    expect(d).toEqual({ kicker: "Devosyon jounen an", callToAction: "Li devosyon an sou zone-chretien.org", title: "Ma grâce" });
    expect(translateDefaultLabels(d, "ht", "fr").kicker).toBe("Dévotion du jour");
  });
  it("un texte saisi par l'utilisateur n'est jamais modifié", () => {
    const d = translateDefaultLabels({ kicker: "Mon accroche", callToAction: "Viens dimanche" }, "fr", "ht");
    expect(d).toEqual({ kicker: "Mon accroche", callToAction: "Viens dimanche" });
  });
});

describe("templates en créole", () => {
  it("valeurs par défaut : accroche et appel en créole, textes d'exemple en français", () => {
    const p = TEMPLATE_METAS.Devotion.defaultProps("9:16", "ht");
    expect(p.language).toBe("ht");
    expect(p.kicker).toBe("Devosyon jounen an");
    expect(p.callToAction).toBe("Li devosyon an sou zone-chretien.org");
    expect(p.title).toBe(TEMPLATE_METAS.Devotion.defaultProps("9:16").title);
    expect(TEMPLATE_METAS.Devotion.schema.safeParse(p).success).toBe(true);
  });
  it("jamais « LSG 1910 » en créole", () => {
    expect(versetSpec({ ...TEMPLATE_METAS.Verset.defaultProps("9:16", "ht"), showVersion: true }).persistentFooter).toBe("Psaume 34:8");
    expect(versetSpec(TEMPLATE_METAS.Verset.defaultProps("9:16")).persistentFooter).toBe("Psaume 34:8 · LSG 1910");
    expect(devotionSpec({ ...TEMPLATE_METAS.Devotion.defaultProps("9:16", "ht"), showVersion: true }).screens[1].footer).toBe("2 Corinthiens 12:9");
  });
  it("événement : date et heure du soir en créole", () => {
    const spec = evenementSpec(TEMPLATE_METAS.Evenement.defaultProps("9:16", "ht"));
    const details = spec.screens[0].blocks.find((b) => b.type === "details");
    expect(details && details.type === "details" ? details.items.map((i) => i.text) : []).toEqual(["Samdi 17 oktòb 2026", "7è30 nan aswè", "Église de la Grâce"]);
  });
});
