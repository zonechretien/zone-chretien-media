import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { getTestimonies } from "@/lib/queries/testimonies";
import { PageHeader } from "@/components/shared/page-header";
import { TestimonyCard } from "@/components/cards/testimony-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Témoignages",
  description: "Témoignages écrits, histoires inspirantes et expériences chrétiennes.",
  path: "/temoignages",
});

export default async function TestimoniesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const { testimonies, pages } = await getTestimonies({ page, query: params.q });

  return (
    <div>
      <PageHeader
        title="Témoignages"
        description="Des vies transformées par la grâce de Dieu — histoires inspirantes et expériences chrétiennes."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {testimonies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonies.map((testimony) => (
                <TestimonyCard key={testimony.id} testimony={testimony} />
              ))}
            </div>
            <Pagination page={page} pages={pages} basePath="/temoignages" searchParams={{ q: params.q }} />
          </>
        ) : (
          <EmptyState icon={UserRound} title="Aucun témoignage pour le moment" />
        )}
      </div>
    </div>
  );
}
