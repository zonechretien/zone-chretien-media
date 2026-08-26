import { SectionHeading } from "@/components/shared/section-heading";
import { PlaylistCard, type PlaylistCardData } from "@/components/cards/playlist-card";

export function PlaylistsSection({ playlists }: { playlists: PlaylistCardData[] }) {
  if (playlists.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Sélections"
        title="Playlists du moment"
        href="/playlists"
        className="mb-6"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {playlists.map((playlist) => (
          <PlaylistCard key={playlist.slug} playlist={playlist} />
        ))}
      </div>
    </section>
  );
}
