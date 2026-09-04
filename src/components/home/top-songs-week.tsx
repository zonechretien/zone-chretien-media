import { SectionHeading } from "@/components/shared/section-heading";
import { TopSongRow } from "@/components/songs/top-song-row";
import type { Track } from "@/components/shared/audio-player-provider";

export function TopSongsWeek({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Tendance"
        title="Top 10 de la semaine"
        href="/classement"
        hrefLabel="Voir le classement complet"
        className="mb-6"
      />
      <div className="mx-auto max-w-2xl rounded-2xl bg-brand-white px-5 shadow-brand-sm sm:px-6">
        {tracks.map((track, i) => (
          <TopSongRow key={track.id} rank={i + 1} track={track} />
        ))}
      </div>
    </section>
  );
}
