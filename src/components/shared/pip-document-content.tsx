"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useAudioPlayer } from "@/components/shared/audio-player-provider";

/** Contenu compact rendu à l'intérieur de la fenêtre Document Picture-in-Picture
 * (via createPortal dans AudioPlayerProvider) — reste dans le même arbre React
 * que le reste du site, donc useAudioPlayer() reflète l'état réel et toute
 * action ici (play/pause/suivant/précédent) agit directement sur le vrai
 * lecteur, sans état dupliqué. */
export function PipDocumentContent() {
  const { currentTrack, isPlaying, togglePlay, next, previous, queueIndex, queue } = useAudioPlayer();

  if (!currentTrack) return null;

  return (
    <div className="flex h-full items-center gap-3 bg-brand-navy p-3 font-body text-white">
      <div className="relative h-full aspect-square shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-blue to-brand-gold">
        {/* eslint-disable-next-line @next/next/no-img-element -- fenêtre PiP : document séparé, next/image n'y fonctionne pas. */}
        <img src={currentTrack.imageUrl} alt={currentTrack.title} className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{currentTrack.title}</p>
        <p className="truncate text-xs text-brand-gray">{currentTrack.artistName}</p>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={previous}
            disabled={queueIndex === 0}
            aria-label="Piste précédente"
            className="text-white transition hover:text-brand-gold disabled:opacity-30"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Mettre en pause" : "Lire"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-brand-navy transition hover:bg-brand-gold-light"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={queueIndex + 1 >= queue.length}
            aria-label="Piste suivante"
            className="text-white transition hover:text-brand-gold disabled:opacity-30"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
