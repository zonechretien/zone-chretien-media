/**
 * Calcul du minutage d'une vidéo découpée en écrans (logique pure, partagée
 * entre l'aperçu et le rendu pour garantir la même durée des deux côtés).
 */

export type Segment = { from: number; duration: number };

export type SequenceTiming = {
  introFrames: number;
  segments: Segment[];
  endCard: Segment;
  totalFrames: number;
};

export type TimingOptions = {
  fps: number;
  /** Durée « naturelle » de chaque écran, en secondes. */
  segmentSeconds: number[];
  introSeconds: number;
  endCardSeconds: number;
  /** Durée totale imposée (null = durée naturelle). */
  durationSeconds: number | null;
  /** Aucun écran ne descend sous cette durée, même si la durée imposée est courte. */
  minSegmentSeconds: number;
};

/** Temps de lecture confortable d'un écran de texte affiché mot par mot. */
export function readingSeconds(wordCount: number): number {
  const seconds = wordCount / 3 + 1.6;
  return Math.min(14, Math.max(3.5, seconds));
}

export function computeSequenceTiming(o: TimingOptions): SequenceTiming {
  const introFrames = Math.round(o.introSeconds * o.fps);
  const endFrames = Math.round(o.endCardSeconds * o.fps);

  let seconds = o.segmentSeconds;
  if (o.durationSeconds !== null && seconds.length > 0) {
    const available = o.durationSeconds - o.introSeconds - o.endCardSeconds;
    const natural = seconds.reduce((a, b) => a + b, 0);
    const scale = available / natural;
    seconds = seconds.map((s) => Math.max(o.minSegmentSeconds, s * scale));
  }

  let frames = seconds.map((s) => Math.round(s * o.fps));
  if (o.durationSeconds !== null && frames.length > 0) {
    // Durée imposée : la somme des arrondis doit tomber pile sur la durée
    // demandée — on répartit l'écart (quelques images) sur les écrans les plus
    // longs, sans jamais passer sous la durée minimale d'un écran.
    const target = Math.round(o.durationSeconds * o.fps) - introFrames - endFrames;
    const minFrames = Math.round(o.minSegmentSeconds * o.fps);
    let diff = target - frames.reduce((a, b) => a + b, 0);
    const order = frames.map((f, i) => [f, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
    frames = [...frames];
    for (let k = 0; diff !== 0 && k < order.length * 1000; k++) {
      const i = order[k % order.length];
      if (diff > 0) {
        frames[i]++;
        diff--;
      } else if (frames[i] > minFrames) {
        frames[i]--;
        diff++;
      }
    }
  }

  const segments: Segment[] = [];
  let cursor = introFrames;
  for (const duration of frames) {
    segments.push({ from: cursor, duration });
    cursor += duration;
  }

  const endCard = { from: cursor, duration: endFrames };
  return { introFrames, segments, endCard, totalFrames: cursor + endFrames };
}
