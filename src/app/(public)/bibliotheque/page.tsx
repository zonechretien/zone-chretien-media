import type { Metadata } from "next";
import { Library } from "lucide-react";
import { getResources } from "@/lib/queries/resources";
import { getCategories } from "@/lib/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { InlineSearchInput } from "@/components/shared/inline-search-input";
import { BookCard } from "@/components/cards/book-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Bibliothèque",
  description:
    "Découvrez et lisez un extrait gratuit de nos livres chrétiens : théologie, dévotion, témoignages et plus encore.",
  path: "/bibliotheque",
});

function isSort(value: string | undefined): value is "recent" | "ancien" {
  return value === "recent" || value === "ancien";
}

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const categorySlug = params.category;
  const query = params.q;
  const sort = isSort(params.sort) ? params.sort : "recent";

  const [{ resources: books, pages }, categories] = await Promise.all([
    getResources({ page, type: "BOOK", categorySlug, query, sort }),
    getCategories("RESOURCE"),
  ]);

  return (
    <div>
      <PageHeader
        title="Bibliothèque"
        description="Découvrez nos livres chrétiens, lisez un extrait gratuit et contactez-nous pour obtenir l'ouvrage complet."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InlineSearchInput
            basePath="/bibliotheque"
            placeholder="Rechercher un titre, un auteur…"
            className="w-full sm:w-72"
          />
          <FilterBar
            basePath="/bibliotheque"
            filters={[
              {
                key: "category",
                label: "Toutes les catégories",
                options: categories.map((c) => ({ value: c.slug, label: c.name })),
              },
              {
                key: "sort",
                label: "Plus récents",
                options: [{ value: "ancien", label: "Plus anciens" }],
              },
            ]}
          />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              basePath="/bibliotheque"
              searchParams={{ category: categorySlug, q: query, sort: sort === "ancien" ? sort : undefined }}
            />
          </>
        ) : (
          <EmptyState
            icon={Library}
            title="Aucun livre trouvé"
            description="Essayez d'ajuster vos filtres ou revenez plus tard."
          />
        )}
      </div>
    </div>
  );
}
