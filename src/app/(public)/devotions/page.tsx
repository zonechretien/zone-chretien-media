import type { Metadata } from "next";
import { BookMarked } from "lucide-react";
import { getDevotions } from "@/lib/queries/devotions";
import { PageHeader } from "@/components/shared/page-header";
import { DevotionCard } from "@/components/cards/devotion-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Dévotions quotidiennes",
  description: "Méditations bibliques quotidiennes : verset, réflexion, application pratique et prière.",
  path: "/devotions",
});

export default async function DevotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const { devotions, pages } = await getDevotions({ page, query: params.q });

  return (
    <div>
      <PageHeader
        title="Dévotions quotidiennes"
        description="Verset, réflexion, application pratique et prière pour chaque jour."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {devotions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devotions.map((devotion) => (
                <DevotionCard key={devotion.id} devotion={devotion} />
              ))}
            </div>
            <Pagination page={page} pages={pages} basePath="/devotions" searchParams={{ q: params.q }} />
          </>
        ) : (
          <EmptyState icon={BookMarked} title="Aucune dévotion pour le moment" />
        )}
      </div>
    </div>
  );
}
