import type { Metadata } from "next";
import { Quote } from "lucide-react";
import { getVerses } from "@/lib/queries/verses";
import { PageHeader } from "@/components/shared/page-header";
import { VerseCard } from "@/components/cards/verse-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Versets du jour",
  description: "Archive des versets du jour avec référence biblique, texte et explication.",
  path: "/versets",
});

export default async function VersesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const { verses, pages } = await getVerses({ page, query: params.q });

  return (
    <div>
      <PageHeader title="Versets du jour" description="La Parole de Dieu pour nourrir votre foi, chaque jour." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {verses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {verses.map((verse) => (
                <VerseCard key={verse.id} verse={verse} />
              ))}
            </div>
            <Pagination page={page} pages={pages} basePath="/versets" searchParams={{ q: params.q }} />
          </>
        ) : (
          <EmptyState icon={Quote} title="Aucun verset publié pour le moment" />
        )}
      </div>
    </div>
  );
}
