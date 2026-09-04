"use client";

import Image from "next/image";
import { ListMusic, Pause, Play } from "lucide-react";
import { useAudioPlayer, type Track } from "@/components/shared/audio-player-provider";

export type PlaylistHeroData = {
  title: string;
  description: string | null;
  imageUrl: string | null;
  tracks: Track[];
};

export function PlaylistHero({ data }: { data: PlaylistHeroData }) {
  const { title, description, imageUrl, tracks } = data;
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudioPlayer();

  const playableTracks = tracks.filter((t) => t.audioUrl && t.playable !== false);
  const isCurrentInPlaylist = !!currentTrack && playableTracks.some((t) => t.id === currentTrack.id);
  const playing = isCurrentInPlaylist && isPlaying;

  function handlePlayAll() {
    if (playableTracks.length === 0) return;
    if (isCurrentInPlaylist) togglePlay();
    else playTrack(playableTracks[0], playableTracks);
  }

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
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/15 px-3.5 py-1.5 font-body text-[11px] font-semibold uppercase tracking-widest text-brand-gold-light">
            <ListMusic size={11} />
            Playlist
          </span>
          <h1 className="mb-4 font-display text-[28px] font-black leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[44px]">
            {title}
          </h1>
          {description && (
            <p className="mb-7 max-w-xl font-body text-base leading-relaxed text-white/75">{description}</p>
          )}
          <div className="mb-7 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-body text-[13px] text-white/65">
              <ListMusic size={13} className="text-brand-gold" />
              {tracks.length} {tracks.length > 1 ? "chansons" : "chanson"}
            </span>
          </div>
          {playableTracks.length > 0 && (
            <button
              type="button"
              onClick={handlePlayAll}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light px-6 py-3 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(232,160,32,0.4)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-brand-gold">
                {playing ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" className="ml-0.5" />}
              </span>
              {playing ? "En lecture" : "Lire tout"}
            </button>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="relative aspect-square max-h-[360px] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue to-brand-gold shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            {imageUrl ? (
              <Image src={imageUrl} alt={title} fill className="object-cover" sizes="360px" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/30">
                <ListMusic size={56} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
