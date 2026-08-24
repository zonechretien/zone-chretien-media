import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, UserRound } from "lucide-react";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries/articles";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { ShareButtons } from "@/components/shared/share-buttons";
import { SectionHeading } from "@/components/shared/section-heading";
import { ArticleCard } from "@/components/cards/article-card";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.metaTitle ?? article.title;
  const description = article.metaDescription ?? article.excerpt ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title,
      description,
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
      type: "article",
      publishedTime: (article.publishedAt ?? article.createdAt).toISOString(),
      url: `/blog/${article.slug}`,
    },
    twitter: { card: "summary_large_image", title, description, images: article.coverImageUrl ? [article.coverImageUrl] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  trackView("ARTICLE", article.id);

  const related = await getRelatedArticles(article.id, article.categoryId);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt ?? undefined,
          image: article.coverImageUrl ?? undefined,
          datePublished: (article.publishedAt ?? article.createdAt).toISOString(),
          dateModified: article.updatedAt.toISOString(),
          url: absoluteUrl(`/blog/${article.slug}`),
          author: { "@type": "Person", name: article.author.name ?? "Zone-Chrétien Media" },
          publisher: { "@type": "Organization", name: "Zone-Chrétien Media" },
        }}
      />
      {article.category && (
        <span className="w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
          {article.category.name}
        </span>
      )}
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {article.title}
      </h1>
      <div className="mt-3 flex items-center gap-4 text-sm text-muted">
        <span className="flex items-center gap-1">
          <UserRound size={14} /> {article.author.name ?? "Zone-Chrétien"}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={14} /> {formatDate(article.publishedAt ?? article.createdAt)}
        </span>
      </div>

      {article.coverImageUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-navy">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
            priority
          />
        </div>
      )}

      <div
        className="prose prose-neutral mt-8 max-w-none leading-relaxed dark:prose-invert prose-headings:text-foreground prose-a:text-navy dark:prose-a:text-gold-soft"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
      />

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag.id} className="rounded-full bg-surface px-3 py-1 text-xs text-muted">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={`/blog/${article.slug}`} title={article.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Articles similaires" className="mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
