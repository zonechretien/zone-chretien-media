"use client";

import Image from "next/image";
import {
  AlertTriangle,
  ChevronUp,
  ListMusic,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAudioPlayer } from "@/components/shared/audio-player-provider";
import { ProgressBar, formatTime } from "@/components/shared/progress-bar";
import { cn } from "@/lib/utils";

/** Barre de lecture persistante en bas de l'écran — pochette + titre/artiste à
 * gauche, contrôles centraux, aléatoire/répétition/volume/file à droite.
 * Cliquer la barre (hors contrôles) ouvre le panneau complet. */
export function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    next,
    previous,
    queueIndex,
    queue,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    toggleMute,
    shuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeatMode,
    playerError,
    expand,
    pipSupport,
    pipOpen,
    togglePip,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;

  return (
    <>
      <div className="h-[72px]" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-brand-gold bg-brand-navy shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
        {playerError && (
          <div className="flex items-center gap-2 border-b border-white/10 bg-red-500/10 px-4 py-1.5 font-body text-[12px] text-red-200 sm:px-6">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="truncate">{playerError}</span>
          </div>
        )}
        <button
          type="button"
          onClick={expand}
          aria-label="Ouvrir le lecteur"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left sm:gap-5 sm:px-6"
        >
          <span className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-blue to-brand-gold">
            <Image src={currentTrack.imageUrl} alt={currentTrack.title} fill unoptimized className="object-cover" sizes="46px" />
          </span>

          <span className="min-w-0 flex-1 sm:w-40 sm:flex-none">
            <span className="block truncate font-body text-[13px] font-semibold text-white">{currentTrack.title}</span>
            <span className="block truncate text-[11px] text-brand-gray">{currentTrack.artistName}</span>
          </span>

          <span className="hidden items-center gap-3.5 sm:flex">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); previous(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); previous(); } }}
              aria-label="Piste précédente"
              aria-disabled={queueIndex === 0}
              className={cn(
                "rounded-full p-1.5 text-brand-gray transition hover:bg-white/10 hover:text-white",
                queueIndex === 0 && "pointer-events-none opacity-30",
              )}
            >
              <SkipBack size={16} fill="currentColor" />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); togglePlay(); } }}
              aria-label={isPlaying ? "Mettre en pause" : "Lire"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-navy transition hover:scale-105 hover:bg-brand-gold-light"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); next(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); next(); } }}
              aria-label="Piste suivante"
              aria-disabled={queueIndex + 1 >= queue.length}
              className={cn(
                "rounded-full p-1.5 text-brand-gray transition hover:bg-white/10 hover:text-white",
                queueIndex + 1 >= queue.length && "pointer-events-none opacity-30",
              )}
            >
              <SkipForward size={16} fill="currentColor" />
            </span>
          </span>

          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); togglePlay(); } }}
            aria-label={isPlaying ? "Mettre en pause" : "Lire"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy sm:hidden"
          >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
          </span>

          <span className="hidden flex-[2] items-center gap-2.5 md:flex">
            <span className="w-9 shrink-0 text-right font-body text-[11px] text-brand-gray">{formatTime(currentTime)}</span>
            <span onClick={(e) => e.stopPropagation()} className="flex-1">
              <ProgressBar current={currentTime} duration={duration} onSeek={seek} />
            </span>
            <span className="w-9 shrink-0 font-body text-[11px] text-brand-gray">{formatTime(duration)}</span>
          </span>

          <span className="hidden items-center gap-1.5 lg:flex">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleShuffle(); } }}
              aria-label="Lecture aléatoire"
              aria-pressed={shuffle}
              className={cn("rounded-full p-1.5 transition hover:bg-white/10", shuffle ? "text-brand-gold" : "text-brand-gray hover:text-white")}
            >
              <Shuffle size={15} />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); cycleRepeatMode(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); cycleRepeatMode(); } }}
              aria-label="Mode répétition"
              aria-pressed={repeatMode !== "off"}
              className={cn("rounded-full p-1.5 transition hover:bg-white/10", repeatMode !== "off" ? "text-brand-gold" : "text-brand-gray hover:text-white")}
            >
              <RepeatIcon size={15} />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); expand(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); expand(); } }}
              aria-label="Ouvrir la file d'attente"
              className="rounded-full p-1.5 text-brand-gray transition hover:bg-white/10 hover:text-white"
            >
              <ListMusic size={15} />
            </span>
            {pipSupport !== "none" && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); togglePip(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); togglePip(); } }}
                aria-label="Fenêtre flottante"
                aria-pressed={pipOpen}
                className={cn("rounded-full p-1.5 transition hover:bg-white/10", pipOpen ? "text-brand-gold" : "text-brand-gray hover:text-white")}
              >
                <PictureInPicture2 size={15} />
              </span>
            )}
          </span>

          <span className="hidden items-center gap-2 lg:flex">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggleMute(); } }}
              aria-label={volume > 0 ? "Couper le son" : "Rétablir le son"}
              className="text-brand-gray transition hover:text-white"
            >
              {volume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1 w-[70px] cursor-pointer accent-brand-blue-bright"
            />
          </span>

          <ChevronUp size={16} className="hidden shrink-0 text-brand-gray sm:block" />
        </button>
      </div>
    </>
  );
}
