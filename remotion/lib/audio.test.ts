import { describe, expect, it } from "vitest";
import { DUCK_RAMP_SECONDS, durationFittedToVoice, musicVolumeAt, voiceWindow, type VoiceSettings } from "./audio";

const fps = 30;
const music = { volume: 0.8, fadeInSeconds: 1, fadeOutSeconds: 2 };
const voice: VoiceSettings = { startSeconds: 2, mediaDurationSeconds: 4, musicDuckVolume: 0.25, fitDuration: false };
const totalFrames = 15 * fps;

describe("musicVolumeAt", () => {
  it("fondu d'entrée depuis le silence", () => {
    expect(musicVolumeAt(0, { music, totalFrames, fps, voice: null })).toBe(0);
    expect(musicVolumeAt(15, { music, totalFrames, fps, voice: null })).toBeCloseTo(0.4);
    expect(musicVolumeAt(30, { music, totalFrames, fps, voice: null })).toBeCloseTo(0.8);
  });

  it("fondu de sortie jusqu'au silence à la dernière image", () => {
    expect(musicVolumeAt(totalFrames - 60, { music, totalFrames, fps, voice: null })).toBeCloseTo(0.8);
    expect(musicVolumeAt(totalFrames - 30, { music, totalFrames, fps, voice: null })).toBeCloseTo(0.4);
    expect(musicVolumeAt(totalFrames, { music, totalFrames, fps, voice: null })).toBe(0);
  });

  it("baisse pendant la voix off, avec des rampes douces, puis remonte", () => {
    const at = (s: number) => musicVolumeAt(Math.round(s * fps), { music, totalFrames, fps, voice });
    expect(at(1.5)).toBeCloseTo(0.8); // avant la rampe
    expect(at(2 - DUCK_RAMP_SECONDS / 2)).toBeGreaterThan(0.2);
    expect(at(2 - DUCK_RAMP_SECONDS / 2)).toBeLessThan(0.8);
    expect(at(2)).toBeCloseTo(0.8 * 0.25); // voix commencée : musique à 25 %
    expect(at(4)).toBeCloseTo(0.2);
    expect(at(6)).toBeCloseTo(0.2); // fin de la voix
    expect(at(6 + DUCK_RAMP_SECONDS + 0.1)).toBeCloseTo(0.8); // remontée terminée
  });

  it("ne baisse pas si la durée de la voix est inconnue", () => {
    const v = { ...voice, mediaDurationSeconds: null };
    expect(musicVolumeAt(4 * fps, { music, totalFrames, fps, voice: v })).toBeCloseTo(0.8);
    expect(voiceWindow(v, fps)).toBeNull();
  });

  it("sans fondus : volume constant", () => {
    const flat = { volume: 0.5, fadeInSeconds: 0, fadeOutSeconds: 0 };
    expect(musicVolumeAt(0, { music: flat, totalFrames, fps, voice: null })).toBe(0.5);
    expect(musicVolumeAt(totalFrames, { music: flat, totalFrames, fps, voice: null })).toBe(0.5);
  });
});

describe("durationFittedToVoice", () => {
  it("début + voix + pause + écran de fin", () => {
    expect(durationFittedToVoice({ ...voice, fitDuration: true }, 2.5)).toBeCloseTo(2 + 4 + 0.8 + 2.5);
  });

  it("désactivé ou durée inconnue → null", () => {
    expect(durationFittedToVoice(voice, 2.5)).toBeNull();
    expect(durationFittedToVoice({ ...voice, fitDuration: true, mediaDurationSeconds: null }, 2.5)).toBeNull();
    expect(durationFittedToVoice(null, 2.5)).toBeNull();
  });

  it("reste entre 6 et 90 secondes", () => {
    expect(durationFittedToVoice({ ...voice, fitDuration: true, startSeconds: 0, mediaDurationSeconds: 1 }, 2.5)).toBe(6);
    expect(durationFittedToVoice({ ...voice, fitDuration: true, mediaDurationSeconds: 200 }, 2.5)).toBe(90);
  });
});
