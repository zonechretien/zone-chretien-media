"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useAudioPlayer, type Track } from "@/components/shared/audio-player-provider";

export function TopSongRow({ rank, track }: { rank: number; track: Track }) {
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudioPlayer();
  const isCurrent = currentTrack?.id === track.id;
  const playing = isCurrent && isPlaying;

  const rankColor =
    rank === 1 ? "text-brand-gold" : rank === 2 ? "text-brand-gray" : rank === 3 ? "text-[#CD7F32]" : "text-brand-gray-light";

  return (
    <div className="flex items-center gap-3 border-b border-brand-gray-light py-2.5 last:border-0">
      <span className={`w-7 shrink-0 text-center font-accent text-[22px] ${rankColor}`}>{rank}</span>
      <Link href={`/chansons/${track.slug}`} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-navy to-brand-blue-bright">
        <Image src={track.imageUrl} alt={track.title} fill className="object-cover" sizes="44px" />
      </Link>
      <Link href={`/chansons/${track.slug}`} className="min-w-0 flex-1">
        <p className="truncate font-body text-[13px] font-semibold text-brand-navy">{track.title}</p>
        <p className="truncate font-body text-[11px] text-brand-gray">{track.artistName}</p>
      </Link>
      {track.audioUrl && (
        <button
          type="button"
          onClick={() => (isCurrent ? togglePlay() : playTrack(track))}
          aria-label={playing ? "Mettre en pause" : `Lire ${track.title}`}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-off-white text-brand-blue transition hover:bg-brand-gold hover:text-brand-navy"
        >
          {playing ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
        </button>
      )}
    </div>
  );
}
