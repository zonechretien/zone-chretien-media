import { describe, expect, it } from "vitest";
import { collectMediaPaths } from "./jobs";
import { fileTimestamp, isAllowedHost, isLoopbackOrigin, isOriginAllowed, parseRange, slugifyFileName } from "./http-utils";

describe("parseRange", () => {
  it("absent ou mal formé → réponse complète", () => {
    expect(parseRange(undefined, 100)).toBeNull();
    expect(parseRange("octets=0-1", 100)).toBeNull();
    expect(parseRange("bytes=-", 100)).toBeNull();
  });

  it("plage ouverte, fermée et suffixe", () => {
    expect(parseRange("bytes=0-", 100)).toEqual({ start: 0, end: 99 });
    expect(parseRange("bytes=10-19", 100)).toEqual({ start: 10, end: 19 });
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=-500", 100)).toEqual({ start: 0, end: 99 });
  });

  it("fin au-delà du fichier : ramenée à la fin", () => {
    expect(parseRange("bytes=50-1000", 100)).toEqual({ start: 50, end: 99 });
  });

  it("plage impossible → 416", () => {
    expect(parseRange("bytes=100-", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=20-10", 100)).toBe("unsatisfiable");
    expect(parseRange("bytes=-0", 100)).toBe("unsatisfiable");
  });
});

describe("isOriginAllowed", () => {
  const allowed = ["https://zone-chretien-media.vercel.app", "http://localhost:3000"];

  it("accepte uniquement les origines exactes", () => {
    expect(isOriginAllowed("https://zone-chretien-media.vercel.app", allowed)).toBe(true);
    expect(isOriginAllowed("http://localhost:3000", allowed)).toBe(true);
  });

  it.each([
    undefined,
    "null",
    "https://zone-chretien-media.vercel.app.evil.com",
    "https://evil-zone-chretien-media.vercel.app",
    "http://zone-chretien-media.vercel.app",
    "http://localhost:3001",
  ])("refuse %s", (o) => expect(isOriginAllowed(o, allowed)).toBe(false));
});

describe("isLoopbackOrigin / isAllowedHost", () => {
  it("reconnaît les adresses locales", () => {
    expect(isLoopbackOrigin("http://localhost:3000")).toBe(true);
    expect(isLoopbackOrigin("http://127.0.0.1:55000")).toBe(true);
    expect(isLoopbackOrigin("https://localhost.evil.com")).toBe(false);
  });

  it("n'accepte que 127.0.0.1 ou localhost sur le bon port", () => {
    expect(isAllowedHost("127.0.0.1:4317", 4317)).toBe(true);
    expect(isAllowedHost("localhost:4317", 4317)).toBe(true);
    expect(isAllowedHost("evil.com:4317", 4317)).toBe(false);
    expect(isAllowedHost("127.0.0.1:80", 4317)).toBe(false);
    expect(isAllowedHost(undefined, 4317)).toBe(false);
  });
});

describe("noms de fichiers d'export", () => {
  it("slug sans accents ni caractères interdits", () => {
    expect(slugifyFileName("Prière du matin : « Psaume 23 » !", "reel")).toBe("priere-du-matin-psaume-23");
    expect(slugifyFileName("***", "verset")).toBe("verset");
    expect(slugifyFileName("..\\..\\CON", "x")).toBe("con");
  });

  it("horodatage lisible", () => {
    expect(fileTimestamp(new Date(2026, 8, 3, 7, 5, 9))).toBe("2026-09-03_07-05-09");
  });
});

describe("collectMediaPaths", () => {
  it("trouve tous les chemins de médias des props", () => {
    const props = {
      background: { type: "image", path: "Fonds/a.jpg" },
      music: { path: "Musiques/b.mp3", volume: 0.5 },
      voix: [{ path: "VoixOff/c.webm" }],
      text: "path",
    };
    expect(collectMediaPaths(props)).toEqual(["Fonds/a.jpg", "Musiques/b.mp3", "VoixOff/c.webm"]);
  });
});
