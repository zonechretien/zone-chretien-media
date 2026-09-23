/**
 * Mixage audio des Reels (logique pure, testée) : courbe de volume de la
 * musique (fondus d'entrée / de sortie, baisse automatique pendant la voix
 * off) et durée de la vidéo calée sur la voix off.
 */

export type MusicSettings = { volume: number; fadeInSeconds: number; fadeOutSeconds: number };
export type VoiceSettings = { startSeconds: number; mediaDurationSeconds: number | null; musicDuckVolume: number; fitDuration: boolean };

/** Durée de la transition quand la musique baisse ou remonte autour de la voix. */
export const DUCK_RAMP_SECONDS = 0.35;
/** Silence laissé après la voix avant l'écran de fin, quand la durée est calée sur la voix. */
export const VOICE_TAIL_SECONDS = 0.8;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Plage de la voix off en images, ou null si sa durée est inconnue. */
export function voiceWindow(voice: VoiceSettings | null, fps: number): { from: number; to: number } | null {
  if (!voice || !voice.mediaDurationSeconds) return null;
  const from = Math.round(voice.startSeconds * fps);
  return { from, to: from + Math.round(voice.mediaDurationSeconds * fps) };
}

/**
 * Volume de la musique à une image donnée : volume de base × fondus ×
 * baisse pendant la voix (rampes douces de DUCK_RAMP_SECONDS).
 */
export function musicVolumeAt(
  frame: number,
  o: { music: MusicSettings; totalFrames: number; fps: number; voice: VoiceSettings | null },
): number {
  const { music, totalFrames, fps } = o;
  const fadeIn = music.fadeInSeconds * fps;
  const fadeOut = music.fadeOutSeconds * fps;
  const inFactor = fadeIn > 0 ? clamp01(frame / fadeIn) : 1;
  const outFactor = fadeOut > 0 ? clamp01((totalFrames - frame) / fadeOut) : 1;

  let duck = 1;
  const w = voiceWindow(o.voice, fps);
  if (w && o.voice) {
    const ramp = DUCK_RAMP_SECONDS * fps;
    // 0 hors de la voix, 1 pendant, avec une rampe avant le début et après la fin.
    const t = clamp01(Math.min((frame - (w.from - ramp)) / ramp, (w.to + ramp - frame) / ramp));
    duck = 1 - t * (1 - o.voice.musicDuckVolume);
  }
  return clamp01(music.volume * inFactor * outFactor * duck);
}

/** Durée totale (s) calée sur la voix off : début + voix + courte pause + écran de fin. */
export function durationFittedToVoice(voice: VoiceSettings | null, endCardSeconds: number): number | null {
  if (!voice?.fitDuration || !voice.mediaDurationSeconds) return null;
  const seconds = voice.startSeconds + voice.mediaDurationSeconds + VOICE_TAIL_SECONDS + endCardSeconds;
  return Math.min(90, Math.max(6, Math.round(seconds * 10) / 10));
}
