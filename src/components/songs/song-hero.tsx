"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Eye, Music4, Pause, Play } from "lucide-react";
import { useAudioPlayer, type Track } from "@/components/shared/audio-player-provider";
import { useVideoModal } from "@/components/shared/video-modal-provider";
import { getYoutubeEmbedUrl } from "@/lib/utils";
import type { SONG_SOURCE_TYPES } from "@/lib/validations/songs";

export type SongHeroData = {
  track: Track;
  sourceType: (typeof SONG_SOURCE_TYPES)[number];
  categoryName: string | null;
  featured: boolean;
  dateLabel: string;
  views: number;
  readingMinutes: number | null;
  excerpt: string | null;
  hasLyrics: boolean;
  hasVideo: boolean;
};

export function SongHero({ data }: { data: SongHeroData }) {
  const { track, sourceType, categoryName, featured, dateLabel, views, readingMinutes, excerpt, hasLyrics, hasVideo } = data;
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudioPlayer();
  const { openVideo } = useVideoModal();

  const isCurrent = currentTrack?.id === track.id;
  const playing = isCurrent && isPlaying;
  const isFileSource = sourceType === "FICHIER_DIRECT";
  const hasAudioEmbed = (sourceType === "SOUNDCLOUD" || sourceType === "AUDIOMACK") && !!track.audioUrl;

  function handlePlay() {
    if (isCurrent) togglePlay();
    else playTrack(track);
  }

  function handlePrimaryAction() {
    if (isFileSource && track.audioUrl) {
      handlePlay();
    } else if (sourceType === "YOUTUBE_MUSIC" && track.audioUrl) {
      const embedUrl = getYoutubeEmbedUrl(track.audioUrl);
      if (embedUrl) openVideo(embedUrl, track.title);
    } else if (hasAudioEmbed) {
      document.getElementById("ecouter")?.scrollIntoView({ behavior: "smooth" });
    } else if (hasVideo) {
      document.getElementById("video")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const showPrimaryButton =
    (isFileSource && !!track.audioUrl) ||
    (sourceType === "YOUTUBE_MUSIC" && !!track.audioUrl) ||
    hasAudioEmbed ||
    hasVideo;

  const primaryButtonLabel = isFileSource
    ? playing
      ? "En lecture"
      : "Écouter maintenant"
    : sourceType === "YOUTUBE_MUSIC" || hasAudioEmbed
      ? "Écouter"
      : "Voir le clip";

  return (
    <section className="relative overflow-hidden bg-brand-navy">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(30,95,168,0.25) 0%, transparent 70%), radial-gradient(ellipse 50% 80% at 10% 80%, rgba(232,160,32,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:items-center lg:py-16 lg:px-8">
        <div>
          {categoryName && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/15 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">
              <Music4 size={11} />
              {categoryName}
            </span>
          )}
          <h1 className="mb-4 font-display text-[28px] font-black leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[44px]">
            {track.title}
          </h1>
          <Link
            href={`/artistes/${track.artistSlug}`}
            className="mb-5 inline-block font-body text-lg text-brand-gold transition hover:underline"
          >
            {track.artistName}
          </Link>
          <div className="mb-7 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-body text-[13px] text-white/65">
              <Calendar size={13} className="text-brand-gold" />
              {dateLabel}
            </span>
            {readingMinutes !== null && (
              <>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5 font-body text-[13px] text-white/65">
                  <Clock size={13} className="text-brand-gold" />
                  {readingMinutes} min de lecture
                </span>
              </>
            )}
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 font-body text-[13px] text-white/65">
              <Eye size={13} className="text-brand-gold" />
              {views.toLocaleString("fr-FR")} vues
            </span>
          </div>
          {excerpt && (
            <p className="mb-8 max-w-xl font-body text-base leading-relaxed text-white/75">{excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-3.5">
            {showPrimaryButton && (
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light px-6 py-3 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(232,160,32,0.4)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-brand-gold">
                  {playing ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-0.5" />}
                </span>
                {primaryButtonLabel}
              </button>
            )}
            {hasLyrics && (
              <a
                href="#lyrics"
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/25 px-5 py-2.5 font-body text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Voir les paroles
              </a>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="group relative aspect-[3/4] max-h-[460px] overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <Image src={track.imageUrl} alt={track.title} fill className="object-cover" sizes="360px" priority />
            {featured && (
              <span className="absolute left-4 top-4 rounded-xl bg-brand-gold px-3 py-1 font-body text-[11px] font-bold uppercase tracking-wide text-brand-navy">
                En vedette
              </span>
            )}
            {isFileSource && track.audioUrl && (
              <button
                type="button"
                onClick={handlePlay}
                aria-label={playing ? "Mettre en pause" : `Lire ${track.title}`}
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"
              >
                <span className="flex h-16 w-16 scale-90 items-center justify-center rounded-full bg-brand-gold text-brand-navy shadow-lg transition group-hover:scale-100">
                  {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
