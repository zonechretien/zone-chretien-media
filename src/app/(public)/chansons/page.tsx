import type { Metadata } from "next";
import { Music4 } from "lucide-react";
import { getSongs } from "@/lib/queries/songs";
import { getCategories } from "@/lib/queries/categories";
import { getArtists } from "@/lib/queries/artists";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { SongCard } from "@/components/cards/song-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Chansons évangéliques",
  description:
    "Découvrez les chansons évangéliques les plus récentes et les plus populaires sur Zone-Chrétien Media.",
  path: "/chansons",
});

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const categorySlug = params.categorie;
  const artistSlug = params.artiste;
  const query = params.q;

  const [{ songs, pages }, categories, { artists }] = await Promise.all([
    getSongs({ page, categorySlug, artistSlug, query }),
    getCategories("SONG"),
    getArtists({ page: 1 }),
  ]);

  return (
    <div>
      <PageHeader
        title="Chansons évangéliques"
        description="Louange, adoration et gospel — écoutez et partagez la musique qui édifie."
      >
        <FilterBar
          basePath="/chansons"
          filters={[
            {
              key: "categorie",
              label: "Toutes les catégories",
              options: categories.map((c) => ({ value: c.slug, label: c.name })),
            },
            {
              key: "artiste",
              label: "Tous les artistes",
              options: artists.map((a) => ({ value: a.slug, label: a.name })),
            },
          ]}
        />
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {songs.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {songs.map((song) => (
                <SongCard key={song.id} song={song} queue={songs} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              basePath="/chansons"
              searchParams={{ categorie: categorySlug, artiste: artistSlug, q: query }}
            />
          </>
        ) : (
          <EmptyState
            icon={Music4}
            title="Aucune chanson trouvée"
            description="Essayez d'ajuster vos filtres ou revenez plus tard."
          />
        )}
      </div>
    </div>
  );
}
