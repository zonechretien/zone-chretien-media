import type { SequenceTiming } from "../timing";
import type { TextStyle, VoiceOverProps, VoiceSyncProps } from "../../schemas";
import type { NarrationScript } from "./script";

/**
 * Minutage d'un Reel synchronisé sur sa voix off (logique pure, testée) :
 * chaque écran commence juste avant son premier mot prononcé, chaque mot a
 * ses images exactes, l'écran de fin suit le dernier mot.
 */

/** Images (absolues) d'un mot : apparition, début et fin de sa prononciation. */
export type WordFrames = { reveal: number; start: number; end: number };

export type SyncedTiming = { timing: SequenceTiming; words: WordFrames[]; style: TextStyle };

/** Un écran apparaît un peu avant son premier mot (le temps de son fondu). */
export const SCREEN_LEAD_FRAMES = 8;
/** Un mot (style « phrase ») apparaît juste avant d'être prononcé. */
const WORD_LEAD_FRAMES = 3;
const MIN_SCREEN_FRAMES = 15;
/** Silence laissé après le dernier mot avant l'écran de fin (secondes). */
export const SYNC_TAIL_SECONDS = 0.8;

/** Synchronisation valable pour ce texte et cette voix, sinon null (le Reel garde le minutage automatique). */
export function activeSync(voice: VoiceOverProps | null, script: NarrationScript): VoiceSyncProps | null {
  const s = voice?.sync;
  if (!voice || !s) return null;
  if (s.audioPath !== voice.path || s.scriptHash !== script.hash || s.words.length !== script.words.length) return null;
  return s;
}

/** Image de la vidéo où l'on entend l'instant `t` du fichier audio (silence du début retiré). */
export function voiceFrame(voice: Pick<VoiceOverProps, "startSeconds">, sync: Pick<VoiceSyncProps, "trimStartSeconds">, t: number, fps: number): number {
  return Math.round((voice.startSeconds + Math.max(0, t - sync.trimStartSeconds)) * fps);
}

export function computeSyncedTiming(o: {
  voice: VoiceOverProps;
  sync: VoiceSyncProps;
  script: NarrationScript;
  screenCount: number;
  fps: number;
  introSeconds: number;
  endCardSeconds: number;
}): SyncedTiming {
  const { voice, sync, script, fps } = o;
  const frameOf = (t: number) => voiceFrame(voice, sync, t, fps);
  const introFrames = Math.round(o.introSeconds * fps);
  const endFrames = Math.round(o.endCardSeconds * fps);

  // Début de chaque écran.
  const firstWord: number[] = Array(o.screenCount).fill(-1);
  script.words.forEach((w, i) => {
    if (firstWord[w.screen] === -1) firstWord[w.screen] = i;
  });
  const starts: number[] = [];
  for (let s = 0; s < o.screenCount; s++) {
    if (s === 0) {
      starts.push(introFrames);
      continue;
    }
    const i = firstWord[s];
    const wanted = i >= 0 ? frameOf(sync.words[i][0]) - SCREEN_LEAD_FRAMES : starts[s - 1] + MIN_SCREEN_FRAMES;
    starts.push(Math.max(starts[s - 1] + MIN_SCREEN_FRAMES, wanted));
  }

  const lastEnd = sync.words.length ? frameOf(Math.max(...sync.words.map((w) => w[1]))) : introFrames;
  const endFrom = Math.max(lastEnd + Math.round(SYNC_TAIL_SECONDS * fps), starts[starts.length - 1] + 2 * MIN_SCREEN_FRAMES);
  const segments = starts.map((from, s) => ({ from, duration: (s + 1 < starts.length ? starts[s + 1] : endFrom) - from }));

  // Images de chaque mot. Style « phrase » : toute la phrase apparaît quand elle commence.
  const sentenceStart = script.sentences.map((st) => frameOf(sync.words[st.first][0]));
  const words = script.words.map((w, i) => {
    const screenFrom = starts[w.screen];
    const start = Math.max(screenFrom, frameOf(sync.words[i][0]));
    const end = Math.max(start + 1, frameOf(sync.words[i][1]));
    const reveal = voice.textStyle === "mot" ? screenFrom : Math.max(screenFrom, sentenceStart[w.sentence] - WORD_LEAD_FRAMES);
    return { reveal, start, end };
  });

  return {
    timing: { introFrames, segments, endCard: { from: endFrom, duration: endFrames }, totalFrames: endFrom + endFrames },
    words,
    style: voice.textStyle,
  };
}
