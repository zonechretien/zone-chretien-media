import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND, withAlpha, wordmarkText } from "./brand";

// Contraste WCAG 2.x. Sur téléphone, en vidéo compressée : texte principal au
// moins 7:1 (AAA) sur les fonds de la charte, tout autre texte au moins 4,5:1 (AA).
type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const luminance = (c: Rgb) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** `top` posé avec l'opacité `alpha` sur `bottom`. */
const over = (top: Rgb, bottom: Rgb, alpha: number): Rgb => top.map((v, i) => v * alpha + bottom[i] * (1 - alpha)) as Rgb;

const C = BRAND.colors;
const brandBackgrounds: Record<string, Rgb> = {
  navyDeep: rgb(C.navyDeep),
  navy: rgb(C.navy),
  navyLight: rgb(C.navyLight),
  ...Object.fromEntries(Object.entries(BRAND.themes).map(([id, t]) => [`dégradé ${id}`, rgb(t.from)])),
};

describe("charte des Reels : contrastes sur les fonds de la charte", () => {
  for (const [bg, color] of Object.entries(brandBackgrounds)) {
    it(`sur ${bg}`, () => {
      expect(contrast(rgb(C.text), color)).toBeGreaterThanOrEqual(7);
      expect(contrast(rgb(C.textMuted), color)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(rgb(C.gold), color)).toBeGreaterThanOrEqual(4.5);
    });
  }

  // Chaque thème : son accent reste lisible sur tout son dégradé (du haut jusqu'au bleu nuit profond).
  for (const [id, t] of Object.entries(BRAND.themes)) {
    it(`accent du thème ${id} (${t.label})`, () => {
      for (const bg of [rgb(t.from), rgb(C.navyDeep)]) expect(contrast(rgb(t.accent), bg)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("texte du bouton d'appel sur l'or", () => {
    expect(contrast(rgb(C.onGold), rgb(C.gold))).toBeGreaterThanOrEqual(7);
  });

  it("le bleu secondaire n'est pas lisible comme texte (réservé au décor)", () => {
    expect(contrast(rgb(C.blue), rgb(C.navyLight))).toBeLessThan(4.5);
  });
});

describe("charte des Reels : fonds photo et vidéo", () => {
  it("le voile minimal garde le texte principal lisible sur une photo blanche", () => {
    const veiled = over(rgb(C.navyDeep), [255, 255, 255], BRAND.readability.minPhotoDim);
    expect(contrast(rgb(C.text), veiled)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("charte des Reels : polices", () => {
  const dir = path.join(__dirname, "..", "public", "reels");
  for (const f of BRAND.fontFiles) {
    it(`${f.family} (${f.style}) : fichier local et licence OFL présents`, () => {
      expect(fs.existsSync(path.join(dir, f.file))).toBe(true);
      const license = fs.readFileSync(path.join(dir, "fonts", f.license), "utf8");
      expect(license).toContain("SIL Open Font License, Version 1.1");
    });
  }
});

describe("charte des Reels : marque", () => {
  it("écrit toujours « ZONE-CHRÉTIEN » avec l'accent", () => {
    expect(wordmarkText()).toBe("ZONE-CHRÉTIEN");
  });

  it("garde la devise du logo", () => {
    expect(BRAND.tagline).toBe("Inspiré par la foi, animé par la Parole");
  });

  for (const file of [BRAND.logo.monogram]) {
    it(`${file} : SVG local, vectoriel, sans image intégrée ni fond, aux proportions déclarées`, () => {
      const svg = fs.readFileSync(path.join(__dirname, "..", "public", "reels", file), "utf8");
      const [, , w, h] = /^<svg[^>]+viewBox="([\d.-]+) ([\d.-]+) ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1).map(Number);
      expect(w / h).toBeCloseTo(BRAND.logo.monogramRatio, 6);
      expect(svg).not.toMatch(/<image|<rect|data:|href="http/);
    });
  }
});

describe("withAlpha", () => {
  it("convertit une couleur de la charte en rgba", () => {
    expect(withAlpha("#0A1628", 0.5)).toBe("rgba(10, 22, 40, 0.5)");
  });
});
