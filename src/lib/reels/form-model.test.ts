import { describe, expect, it } from "vitest";
import { versetSchema } from "@reels/schemas";
import { TEMPLATE_METAS } from "@reels/template-meta";
import { describeObject, errorsByPath, getIn, setIn, type FieldDesc } from "./form-model";

const fields = describeObject(versetSchema);
const byKey = (key: string) => fields.find((f) => f.key === key) as FieldDesc;

describe("describeObject (template Verset)", () => {
  it("masque le format (géré à part) et génère les autres champs dans l'ordre du schéma", () => {
    expect(fields.map((f) => f.key)).toEqual(["background", "durationSeconds", "kicker", "reference", "text", "showVersion"]);
  });

  it("reprend libellés et contraintes du schéma", () => {
    expect(byKey("reference")).toMatchObject({ kind: "text", label: "Référence", maxLength: 60, multiline: false, optional: false });
    expect(byKey("kicker")).toMatchObject({ kind: "text", optional: true, maxLength: 40 });
    expect(byKey("text")).toMatchObject({ kind: "text", multiline: true, maxLength: 1500 });
    expect(byKey("durationSeconds")).toMatchObject({ kind: "number", nullable: true, min: 6, max: 90 });
    expect(byKey("showVersion")).toMatchObject({ kind: "boolean" });
  });

  it("décrit le fond comme une union avec un sélecteur de média typé", () => {
    const bg = byKey("background");
    if (bg.kind !== "union") throw new Error("union attendue");
    expect(bg.options.map((o) => [o.value, o.label])).toEqual([
      ["gradient", "Dégradé"],
      ["color", "Couleur unie"],
      ["image", "Image du disque"],
      ["video", "Vidéo du disque"],
    ]);
    const video = bg.options.find((o) => o.value === "video")!;
    expect(video.fields.map((f) => [f.key, f.kind])).toEqual([
      ["path", "media"],
      ["dim", "number"],
    ]);
    expect(video.fields[0]).toMatchObject({ mediaKind: "video" });
    expect(video.defaults).toEqual({ type: "video", path: "", dim: 0.45, mediaDurationSeconds: null });
  });
});

describe("defaultsFor / errorsByPath", () => {
  it("les valeurs par défaut du template sont valides", () => {
    for (const meta of Object.values(TEMPLATE_METAS)) {
      for (const format of meta.formats) expect(meta.schema.safeParse(meta.defaultProps(format)).success).toBe(true);
    }
  });

  it("donne des couleurs valides par défaut pour un dégradé", () => {
    const bg = byKey("background");
    if (bg.kind !== "union") throw new Error("union attendue");
    const gradient = bg.options.find((o) => o.value === "gradient")!.defaults;
    expect(versetSchema.shape.background.safeParse(gradient).success).toBe(true);
  });

  it("indexe les erreurs par chemin", () => {
    const r = versetSchema.safeParse({ ...TEMPLATE_METAS.Verset.defaultProps("9:16"), reference: "", background: { type: "image", path: "", dim: 0.4 } });
    const errors = errorsByPath(r.error);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["reference", "background.path"]));
  });
});

describe("setIn / getIn", () => {
  it("met à jour un chemin imbriqué sans modifier l'original", () => {
    const original = { a: 1, bg: { type: "image", path: "x.jpg" } };
    const next = setIn(original, ["bg", "path"], "y.jpg");
    expect(next).toEqual({ a: 1, bg: { type: "image", path: "y.jpg" } });
    expect(original.bg.path).toBe("x.jpg");
    expect(getIn(next, ["bg", "path"])).toBe("y.jpg");
    expect(getIn(next, ["absent", "x"])).toBeUndefined();
  });
});
