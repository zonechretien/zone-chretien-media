import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getArtists } from "@/lib/queries/artists";
import { getTags } from "@/lib/queries/tags";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { ArtistCard } from "@/components/cards/artist-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Artistes évangéliques",
  description: "Découvrez les artistes évangéliques et leurs chansons sur Zone-Chrétien Media.",
  path: "/artistes",
});

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const tagSlug = params.tag;
  const [{ artists, pages }, tags] = await Promise.all([
    getArtists({ page, query: params.q, tagSlug }),
    getTags(),
  ]);

  return (
    <div>
      <PageHeader
        title="Artistes évangéliques"
        description="Chanteurs, groupes et ministères de louange qui édifient les nations."
      >
        <FilterBar
          basePath="/artistes"
          filters={[
            {
              key: "tag",
              label: "Tous les tags",
              options: tags.map((t) => ({ value: t.slug, label: t.name })),
            },
          ]}
        />
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {artists.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
            <Pagination page={page} pages={pages} basePath="/artistes" searchParams={{ q: params.q, tag: tagSlug }} />
          </>
        ) : (
          <EmptyState icon={Users} title="Aucun artiste pour le moment" />
        )}
      </div>
    </div>
  );
}
