import type { Metadata } from "next";
import { Library } from "lucide-react";
import { getResources } from "@/lib/queries/resources";
import { getTags } from "@/lib/queries/tags";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS, type ResourceInput } from "@/lib/validations/resources";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { InlineSearchInput } from "@/components/shared/inline-search-input";
import { ResourceCard } from "@/components/cards/resource-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Bibliothèque numérique chrétienne",
  description:
    "Livres, études bibliques, prédications audio et vidéo, conférences et cours — la bibliothèque numérique de Zone-Chrétien Media.",
  path: "/bibliotheque",
});

function isResourceType(value: string | undefined): value is ResourceInput["type"] {
  return !!value && (RESOURCE_TYPES as readonly string[]).includes(value);
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const typeParam = isResourceType(params.type) ? params.type : undefined;
  const tagSlug = params.tag;
  const query = params.q;

  const [{ resources, pages }, tags] = await Promise.all([
    getResources({ page, type: typeParam, tagSlug, query }),
    getTags(),
  ]);

  return (
    <div>
      <PageHeader
        title="Bibliothèque numérique chrétienne"
        description="Livres, études bibliques, prédications et conférences à télécharger ou consulter en ligne."
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
                key: "type",
                label: "Tous les types",
                options: RESOURCE_TYPES.map((t) => ({ value: t, label: RESOURCE_TYPE_LABELS[t] })),
              },
              {
                key: "tag",
                label: "Tous les tags",
                options: tags.map((t) => ({ value: t.slug, label: t.name })),
              },
            ]}
          />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {resources.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              basePath="/bibliotheque"
              searchParams={{ type: typeParam, tag: tagSlug, q: query }}
            />
          </>
        ) : (
          <EmptyState
            icon={Library}
            title="Aucune ressource trouvée"
            description="Essayez d'ajuster vos filtres ou revenez plus tard."
          />
        )}
      </div>
    </div>
  );
}
