"use client";

import { Pause, Play } from "lucide-react";
import { useAudioPlayer, type Track } from "@/components/shared/audio-player-provider";

export function ResourceAudioButton({ track }: { track: Track }) {
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudioPlayer();

  const isCurrent = currentTrack?.id === track.id;
  const playing = isCurrent && isPlaying;

  function handleClick() {
    if (isCurrent) togglePlay();
    else playTrack(track);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light px-6 py-3 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(232,160,32,0.4)]"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-brand-gold">
        {playing ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-0.5" />}
      </span>
      {playing ? "En lecture" : "Écouter la prédication"}
    </button>
  );
}
