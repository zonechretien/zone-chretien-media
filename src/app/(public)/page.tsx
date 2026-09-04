import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getFeaturedSong, getLatestSongs } from "@/lib/queries/songs";
import { getLatestInspirations } from "@/lib/queries/inspirations";
import { getLatestDevotions } from "@/lib/queries/devotions";
import { getLatestTestimonies } from "@/lib/queries/testimonies";
import { getPopularArtists } from "@/lib/queries/artists";
import { getCategories } from "@/lib/queries/categories";
import { getLatestArticles } from "@/lib/queries/articles";
import { getFeaturedPlaylists } from "@/lib/queries/playlists";

import { Hero } from "@/components/home/hero";
import { FeaturedSong } from "@/components/home/featured-song";
import { PopularArtists } from "@/components/home/popular-artists";
import { CategoryGrid } from "@/components/home/category-grid";
import { NewsSection } from "@/components/home/news-section";
import { PlaylistsSection } from "@/components/home/playlists-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { SongCard } from "@/components/cards/song-card";
import { InspirationCard } from "@/components/cards/inspiration-card";
import { DevotionCard } from "@/components/cards/devotion-card";
import { Music4 } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [
    settings,
    featuredSong,
    latestSongs,
    latestInspirations,
    latestDevotions,
    latestTestimonies,
    popularArtists,
    categories,
    latestArticles,
    featuredPlaylists,
  ] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "settings" } }),
    getFeaturedSong(),
    getLatestSongs(8),
    getLatestInspirations(3),
    getLatestDevotions(3),
    getLatestTestimonies(4),
    getPopularArtists(8),
    getCategories(),
    getLatestArticles(4),
    getFeaturedPlaylists(3),
  ]);

  return (
    <div className="flex flex-col gap-16 pb-20 sm:gap-20">
      <Hero
        siteName={settings?.siteName ?? "Zone-Chrétien Media"}
        tagline={
          settings?.siteDescription ??
          "La musique, l'inspiration et la Parole pour édifier les nations."
        }
      />

      {featuredSong && <FeaturedSong song={featuredSong} />}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nouveautés"
          title="Dernières chansons"
          href="/chansons"
          className="mb-6"
        />
        {latestSongs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {latestSongs.map((song) => (
              <SongCard key={song.id} song={song} queue={latestSongs} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Music4}
            title="Aucune chanson publiée pour le moment"
            description="Les nouvelles chansons apparaîtront ici dès leur publication."
          />
        )}
      </section>

      <PlaylistsSection playlists={featuredPlaylists} />

      {categories.length > 0 && <CategoryGrid categories={categories} />}

      {popularArtists.length > 0 && <PopularArtists artists={popularArtists} />}

      {(latestInspirations.length > 0 || latestDevotions.length > 0) && (
        <section className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {latestInspirations.length > 0 && (
            <div>
              <SectionHeading
                eyebrow="Édification"
                title="Dernières inspirations"
                href="/inspirations"
                className="mb-6"
              />
              <div className="flex flex-col gap-4">
                {latestInspirations.map((inspiration) => (
                  <InspirationCard key={inspiration.id} inspiration={inspiration} />
                ))}
              </div>
            </div>
          )}
          {latestDevotions.length > 0 && (
            <div>
              <SectionHeading
                eyebrow="Chaque jour"
                title="Dernières dévotions"
                href="/devotions"
                className="mb-6"
              />
              <div className="flex flex-col gap-4">
                {latestDevotions.map((devotion) => (
                  <DevotionCard key={devotion.id} devotion={devotion} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <NewsSection articles={latestArticles} />

      <TestimonialsSection testimonies={latestTestimonies} />

      <NewsletterSection />
    </div>
  );
}
