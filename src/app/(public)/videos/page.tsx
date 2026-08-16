import type { Metadata } from "next";
import { Video as VideoIcon } from "lucide-react";
import { getVideos } from "@/lib/queries/videos";
import { getCategories } from "@/lib/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { VideoCard } from "@/components/cards/video-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Vidéos chrétiennes",
  description: "Clips, louanges et enseignements en vidéo sur Zone-Chrétien Media.",
  path: "/videos",
});

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const categorySlug = params.categorie;

  const [{ videos, pages }, categories] = await Promise.all([
    getVideos({ page, categorySlug, query: params.q }),
    getCategories("VIDEO"),
  ]);

  return (
    <div>
      <PageHeader title="Vidéos chrétiennes" description="Clips, louanges et enseignements en vidéo.">
        {categories.length > 0 && (
          <FilterBar
            basePath="/videos"
            filters={[
              {
                key: "categorie",
                label: "Toutes les catégories",
                options: categories.map((c) => ({ value: c.slug, label: c.name })),
              },
            ]}
          />
        )}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {videos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              basePath="/videos"
              searchParams={{ categorie: categorySlug }}
            />
          </>
        ) : (
          <EmptyState icon={VideoIcon} title="Aucune vidéo pour le moment" />
        )}
      </div>
    </div>
  );
}
