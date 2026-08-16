import type { Artist } from "@prisma/client";
import { SectionHeading } from "@/components/shared/section-heading";
import { ArtistCard } from "@/components/cards/artist-card";

export function PopularArtists({
  artists,
}: {
  artists: (Artist & { _count: { songs: number } })[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Découvrir"
        title="Artistes populaires"
        href="/artistes"
        className="mb-6"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </section>
  );
}
