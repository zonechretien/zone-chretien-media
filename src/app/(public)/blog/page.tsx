import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { getArticles } from "@/lib/queries/articles";
import { getCategories } from "@/lib/queries/categories";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { ArticleCard } from "@/components/cards/article-card";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog chrétien",
  description: "Enseignements bibliques, études bibliques, réflexions spirituelles et actualités chrétiennes.",
  path: "/blog",
});

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const categorySlug = params.categorie;

  const [{ articles, pages }, categories] = await Promise.all([
    getArticles({ page, categorySlug, query: params.q }),
    getCategories("ARTICLE"),
  ]);

  return (
    <div>
      <PageHeader
        title="Blog chrétien"
        description="Enseignements bibliques, études, réflexions spirituelles et actualités chrétiennes."
      >
        {categories.length > 0 && (
          <FilterBar
            basePath="/blog"
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
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pages}
              basePath="/blog"
              searchParams={{ categorie: categorySlug }}
            />
          </>
        ) : (
          <EmptyState icon={Newspaper} title="Aucun article publié pour le moment" />
        )}
      </div>
    </div>
  );
}
