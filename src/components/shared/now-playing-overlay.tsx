"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { useAudioPlayer } from "@/components/shared/audio-player-provider";
import { ProgressBar, formatTime } from "@/components/shared/progress-bar";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { NowPlayingTabs, type NowPlayingTabKey } from "@/components/shared/now-playing-tabs";
import { NowPlayingQueue } from "@/components/shared/now-playing-queue";
import { NowPlayingLyrics } from "@/components/shared/now-playing-lyrics";
import { NowPlayingComments } from "@/components/shared/now-playing-comments";
import { cn } from "@/lib/utils";

export function NowPlayingOverlay() {
  const {
    currentTrack,
    isExpanded,
    collapse,
    isPlaying,
    togglePlay,
    next,
    previous,
    queueIndex,
    queue,
    currentTime,
    duration,
    seek,
    shuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeatMode,
  } = useAudioPlayer();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<NowPlayingTabKey>("queue");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapse();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded, collapse]);

  if (!mounted || !isExpanded || !currentTrack) return null;

  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6"
      onClick={collapse}
      role="dialog"
      aria-modal="true"
      aria-label={`En cours de lecture : ${currentTrack.title}`}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-brand-white shadow-brand-lg sm:max-h-[85vh] sm:rounded-3xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={collapse}
          aria-label="Fermer le lecteur"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white transition hover:bg-black/35 lg:bg-white/10 lg:text-brand-gray-dark lg:hover:bg-brand-off-white"
        >
          <ChevronDown size={20} />
        </button>

        {/* Colonne gauche : pochette, titre, artiste, transport */}
        <div className="flex flex-col gap-5 bg-brand-navy p-6 sm:p-8 lg:w-[46%] lg:shrink-0">
          <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <Image src={currentTrack.imageUrl} alt={currentTrack.title} fill unoptimized className="object-cover" sizes="360px" priority />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold text-white">{currentTrack.title}</h2>
              <Link href={`/artistes/${currentTrack.artistSlug}`} className="truncate font-body text-sm text-brand-gold hover:underline">
                {currentTrack.artistName}
              </Link>
            </div>
            <FavoriteButton
              type="song"
              id={currentTrack.slug}
              label={currentTrack.title}
              className="h-10 w-10 shrink-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <ProgressBar current={currentTime} duration={duration} onSeek={seek} />
            <div className="flex items-center justify-between font-body text-[11px] text-brand-gray">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Lecture aléatoire"
              aria-pressed={shuffle}
              className={cn("rounded-full p-2 transition hover:bg-white/10", shuffle ? "text-brand-gold" : "text-brand-gray hover:text-white")}
            >
              <Shuffle size={18} />
            </button>
            <button
              type="button"
              onClick={previous}
              disabled={queueIndex === 0}
              aria-label="Piste précédente"
              className="rounded-full p-2 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Mettre en pause" : "Lire"}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-navy transition hover:scale-105 hover:bg-brand-gold-light"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button
              type="button"
              onClick={next}
              disabled={queueIndex + 1 >= queue.length}
              aria-label="Piste suivante"
              className="rounded-full p-2 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <SkipForward size={22} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={cycleRepeatMode}
              aria-label="Mode répétition"
              aria-pressed={repeatMode !== "off"}
              className={cn("rounded-full p-2 transition hover:bg-white/10", repeatMode !== "off" ? "text-brand-gold" : "text-brand-gray hover:text-white")}
            >
              <RepeatIcon size={18} />
            </button>
          </div>
        </div>

        {/* Colonne droite : onglets À suivre / Paroles / Commentaire */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <NowPlayingTabs active={tab} onChange={setTab} />
          <div className="flex-1 overflow-y-auto">
            {tab === "queue" && (
              <div role="tabpanel" id="now-playing-panel-queue" aria-labelledby="now-playing-tab-queue">
                <NowPlayingQueue />
              </div>
            )}
            {tab === "lyrics" && (
              <div role="tabpanel" id="now-playing-panel-lyrics" aria-labelledby="now-playing-tab-lyrics">
                <NowPlayingLyrics lyrics={currentTrack.lyrics} />
              </div>
            )}
            {tab === "comments" && (
              <div role="tabpanel" id="now-playing-panel-comments" aria-labelledby="now-playing-tab-comments">
                <NowPlayingComments />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
