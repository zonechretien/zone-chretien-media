"use client";

import Image from "next/image";
import { ListMusic } from "lucide-react";
import { useAudioPlayer } from "@/components/shared/audio-player-provider";

export function NowPlayingQueue() {
  const { upcomingQueue, playFromQueue, autoplay, toggleAutoplay } = useAudioPlayer();

  return (
    <div className="flex flex-col gap-4 p-4">
      <label className="flex items-center justify-between gap-3 rounded-xl bg-brand-off-white px-3.5 py-2.5">
        <span className="font-body text-[13px] font-medium text-brand-text">Lecture automatique</span>
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={toggleAutoplay}
            className="peer sr-only"
            aria-label="Activer la lecture automatique"
          />
          <span className="absolute inset-0 rounded-full bg-brand-gray-light transition peer-checked:bg-brand-gold" />
          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </span>
      </label>

      {upcomingQueue.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <ListMusic size={28} className="text-brand-gray" />
          <p className="font-body text-sm text-brand-gray-dark">
            Aucune chanson à suivre pour l&apos;instant.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {upcomingQueue.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => playFromQueue(track)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-brand-off-white"
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-navy to-brand-blue">
                  <Image src={track.imageUrl} alt={track.title} fill unoptimized className="object-cover" sizes="40px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-[13px] font-semibold text-brand-text">{track.title}</span>
                  <span className="block truncate font-body text-[11px] text-brand-gray-dark">{track.artistName}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
