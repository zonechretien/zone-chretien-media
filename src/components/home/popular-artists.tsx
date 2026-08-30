import type { Artist } from "@prisma/client";
import { SectionHeading } from "@/components/shared/section-heading";
import { ArtistCard } from "@/components/cards/artist-card";
import { Carousel, CarouselItem } from "@/components/shared/carousel";

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
      <Carousel autoPlay>
        {artists.map((artist) => (
          <CarouselItem key={artist.id} className="w-[140px] sm:w-[160px] md:w-[180px]">
            <ArtistCard artist={artist} />
          </CarouselItem>
        ))}
      </Carousel>
    </section>
  );
}
