import type { Metadata } from "next";
import { HandHeart } from "lucide-react";
import type { PrayerCategory } from "@prisma/client";
import { getPrayers } from "@/lib/queries/prayers";
import { PRAYER_CATEGORY_LABELS } from "@/lib/validations/prayers";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { PrayerCard } from "@/components/cards/prayer-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Prières",
  description:
    "Prières du matin, de midi, du soir, familiales, pour la guérison et pour la protection.",
  path: "/prieres",
});

export default async function PrayersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const category = params.categorie as PrayerCategory | undefined;

  const { prayers, pages } = await getPrayers({ page, category, query: params.q });

  return (
    <div>
      <PageHeader
        title="Prières"
        description="Matin, midi, soir, famille, guérison, protection — une prière pour chaque moment."
      >
        <FilterBar
          basePath="/prieres"
          filters={[
            {
              key: "categorie",
              label: "Toutes les catégories",
              options: Object.entries(PRAYER_CATEGORY_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            },
          ]}
        />
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {prayers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prayers.map((prayer) => (
                <PrayerCard key={prayer.id} prayer={prayer} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              basePath="/prieres"
              searchParams={{ categorie: category }}
            />
          </>
        ) : (
          <EmptyState icon={HandHeart} title="Aucune prière trouvée" />
        )}
      </div>
    </div>
  );
}
