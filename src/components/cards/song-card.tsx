"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Eye } from "lucide-react";
import type { Artist, Category, Song } from "@prisma/client";
import { formatDateShort, formatViews } from "@/lib/utils";
import { useAudioPlayer, type Track } from "@/components/shared/audio-player-provider";

type SongWithRelations = Song & { artist: Artist; category: Category | null };

function toTrack(song: SongWithRelations): Track {
  return {
    id: song.id,
    slug: song.slug,
    title: song.title,
    artistName: song.artist.name,
    artistSlug: song.artist.slug,
    imageUrl: song.imageUrl,
    audioUrl: song.audioUrl ?? "",
  };
}

export function SongCard({
  song,
  queue,
}: {
  song: SongWithRelations;
  /** Chansons de la page courante (pour les boutons précédent/suivant du lecteur). */
  queue?: SongWithRelations[];
}) {
  const { playTrack } = useAudioPlayer();

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    playTrack(
      toTrack(song),
      queue?.filter((s) => s.audioUrl).map(toTrack),
    );
  }

  return (
    <Link
      href={`/chansons/${song.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-navy">
        <Image
          src={song.imageUrl}
          alt={song.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
        {song.audioUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition group-hover:bg-navy/40 group-hover:opacity-100">
            <button
              type="button"
              onClick={handlePlay}
              aria-label={`Lire ${song.title}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-navy transition hover:scale-105"
            >
              <Play size={20} fill="currentColor" />
            </button>
          </div>
        )}
        {song.category && (
          <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-medium text-white">
            {song.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{song.title}</h3>
        <p className="line-clamp-1 text-sm text-muted">{song.artist.name}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{formatDateShort(song.publishedAt ?? song.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {formatViews(song.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}
