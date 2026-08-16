import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getInspirations } from "@/lib/queries/inspirations";
import { getCategories } from "@/lib/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { InspirationCard } from "@/components/cards/inspiration-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Inspirations chrétiennes",
  description: "Pensées du jour, citations chrétiennes, encouragements et réflexions spirituelles.",
  path: "/inspirations",
});

export default async function InspirationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const categorySlug = params.categorie;

  const [{ inspirations, pages }, categories] = await Promise.all([
    getInspirations({ page, categorySlug, query: params.q }),
    getCategories("INSPIRATION"),
  ]);

  return (
    <div>
      <PageHeader
        title="Inspirations chrétiennes"
        description="Pensées du jour, citations, encouragements et réflexions spirituelles."
      >
        {categories.length > 0 && (
          <FilterBar
            basePath="/inspirations"
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
        {inspirations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inspirations.map((inspiration) => (
                <InspirationCard key={inspiration.id} inspiration={inspiration} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              basePath="/inspirations"
              searchParams={{ categorie: categorySlug }}
            />
          </>
        ) : (
          <EmptyState icon={Sparkles} title="Aucune inspiration pour le moment" />
        )}
      </div>
    </div>
  );
}
