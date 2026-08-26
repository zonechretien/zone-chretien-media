import type { Metadata } from "next";
import { ListMusic } from "lucide-react";
import { getPlaylists } from "@/lib/queries/playlists";
import { PageHeader } from "@/components/shared/page-header";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Playlists",
  description: "Des sélections de chansons évangéliques préparées pour chaque moment — louange, adoration et méditation.",
  path: "/playlists",
});

export default async function PlaylistsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;

  const { playlists, pages } = await getPlaylists({ page });

  return (
    <div>
      <PageHeader
        title="Playlists"
        description="Des sélections de chansons préparées pour chaque moment — louange, adoration et méditation."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {playlists.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
            <Pagination page={page} pages={pages} basePath="/playlists" />
          </>
        ) : (
          <EmptyState
            icon={ListMusic}
            title="Aucune playlist pour le moment"
            description="Les prochaines sélections apparaîtront ici dès leur publication."
          />
        )}
      </div>
    </div>
  );
}
