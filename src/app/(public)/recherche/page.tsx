import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { globalSearch } from "@/lib/queries/search";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { SongCard } from "@/components/cards/song-card";
import { ArtistCard } from "@/components/cards/artist-card";
import { ArticleCard } from "@/components/cards/article-card";
import { InspirationCard } from "@/components/cards/inspiration-card";
import { DevotionCard } from "@/components/cards/devotion-card";
import { PrayerCard } from "@/components/cards/prayer-card";
import { TestimonyCard } from "@/components/cards/testimony-card";
import { VerseCard } from "@/components/cards/verse-card";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Recherche",
  description: "Recherchez des chansons, artistes, versets, articles et plus sur Zone-Chrétien Media.",
  path: "/recherche",
  noIndex: true,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await globalSearch(q);

  return (
    <div>
      <PageHeader title="Recherche" description={q ? `Résultats pour « ${q} »` : "Explorez tout le contenu du site."}>
        <SearchBar defaultValue={q} size="lg" className="max-w-xl" />
      </PageHeader>

      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-10 sm:px-6 lg:px-8">
        {!q ? (
          <EmptyState icon={SearchX} title="Entrez un terme de recherche" />
        ) : results.isEmpty ? (
          <EmptyState
            icon={SearchX}
            title="Aucun résultat trouvé"
            description="Essayez un autre mot-clé, ou vérifiez l'orthographe."
          />
        ) : (
          <>
            {results.songs.length > 0 && (
              <section>
                <SectionHeading title="Chansons" className="mb-6" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {results.songs.map((song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              </section>
            )}

            {results.artists.length > 0 && (
              <section>
                <SectionHeading title="Artistes" className="mb-6" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {results.artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={{ ...artist, _count: { songs: 0 } }} />
                  ))}
                </div>
              </section>
            )}

            {results.articles.length > 0 && (
              <section>
                <SectionHeading title="Blog" className="mb-6" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {results.inspirations.length > 0 && (
              <section>
                <SectionHeading title="Inspirations" className="mb-6" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.inspirations.map((inspiration) => (
                    <InspirationCard key={inspiration.id} inspiration={inspiration} />
                  ))}
                </div>
              </section>
            )}

            {results.devotions.length > 0 && (
              <section>
                <SectionHeading title="Dévotions" className="mb-6" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.devotions.map((devotion) => (
                    <DevotionCard key={devotion.id} devotion={devotion} />
                  ))}
                </div>
              </section>
            )}

            {results.prayers.length > 0 && (
              <section>
                <SectionHeading title="Prières" className="mb-6" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.prayers.map((prayer) => (
                    <PrayerCard key={prayer.id} prayer={prayer} />
                  ))}
                </div>
              </section>
            )}

            {results.testimonies.length > 0 && (
              <section>
                <SectionHeading title="Témoignages" className="mb-6" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.testimonies.map((testimony) => (
                    <TestimonyCard key={testimony.id} testimony={testimony} />
                  ))}
                </div>
              </section>
            )}

            {results.verses.length > 0 && (
              <section>
                <SectionHeading title="Versets" className="mb-6" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.verses.map((verse) => (
                    <VerseCard key={verse.id} verse={verse} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
