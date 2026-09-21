"use client";

import { Music4 } from "lucide-react";
import { SongLyrics } from "@/components/songs/song-lyrics";

export function NowPlayingLyrics({ lyrics }: { lyrics?: string }) {
  if (!lyrics) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <Music4 size={28} className="text-brand-gray" />
        <p className="font-body text-sm text-brand-gray-dark">Aucune parole disponible pour cette chanson.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <SongLyrics lyrics={lyrics} />
    </div>
  );
}
