"use client";

import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useAudioPlayer, type Track } from "@/components/shared/audio-player-provider";

export function PlaylistTrackList({ tracks }: { tracks: Track[] }) {
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudioPlayer();
  const playableTracks = tracks.filter((t) => t.audioUrl);

  return (
    <ul className="flex flex-col gap-1">
      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.id === track.id;
        const playing = isCurrent && isPlaying;

        function handlePlay(e: React.MouseEvent) {
          e.preventDefault();
          e.stopPropagation();
          if (!track.audioUrl) return;
          if (isCurrent) togglePlay();
          else playTrack(track, playableTracks);
        }

        return (
          <li key={track.id}>
            <Link
              href={`/chansons/${track.slug}`}
              className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition hover:bg-surface"
            >
              <span className="w-5 shrink-0 text-center text-sm text-muted">{index + 1}</span>
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-navy">
                <Image src={track.imageUrl} alt="" fill className="object-cover" sizes="44px" />
                {track.audioUrl && (
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label={playing ? "Mettre en pause" : `Lire ${track.title}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
                  >
                    {playing ? (
                      <Pause size={15} fill="currentColor" className="text-white" />
                    ) : (
                      <Play size={15} fill="currentColor" className="ml-0.5 text-white" />
                    )}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isCurrent ? "text-gold" : "text-foreground"}`}>
                  {track.title}
                </p>
                <p className="truncate text-xs text-muted">{track.artistName}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
