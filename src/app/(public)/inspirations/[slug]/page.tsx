import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, UserRound } from "lucide-react";
import { getInspirationBySlug } from "@/lib/queries/inspirations";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { ShareButtons } from "@/components/shared/share-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { renderMarkdown, markdownToText } from "@/lib/markdown";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inspiration = await getInspirationBySlug(slug);
  if (!inspiration) return {};

  const description = markdownToText(inspiration.content).slice(0, 160);

  return {
    title: inspiration.title,
    description,
    alternates: { canonical: `/inspirations/${inspiration.slug}` },
    openGraph: {
      title: inspiration.title,
      description,
      images: inspiration.imageUrl ? [inspiration.imageUrl] : undefined,
      type: "article",
      url: `/inspirations/${inspiration.slug}`,
    },
    twitter: { card: "summary_large_image", title: inspiration.title, description },
  };
}

export default async function InspirationPage({ params }: Props) {
  const { slug } = await params;
  const inspiration = await getInspirationBySlug(slug);
  if (!inspiration) notFound();

  trackView("INSPIRATION", inspiration.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: inspiration.title,
          headline: inspiration.title,
          description: markdownToText(inspiration.content).slice(0, 160),
          image: inspiration.imageUrl ?? undefined,
          author: inspiration.author ? { "@type": "Person", name: inspiration.author } : undefined,
          datePublished: inspiration.createdAt.toISOString(),
          url: absoluteUrl(`/inspirations/${inspiration.slug}`),
        }}
      />
      {inspiration.category && (
        <span className="w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
          {inspiration.category.name}
        </span>
      )}
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {inspiration.title}
      </h1>
      <div className="mt-3 flex items-center gap-4 text-sm text-muted">
        {inspiration.author && (
          <span className="flex items-center gap-1">
            <UserRound size={14} /> {inspiration.author}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={14} /> {formatDate(inspiration.createdAt)}
        </span>
      </div>

      {inspiration.imageUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-navy">
          <Image
            src={inspiration.imageUrl}
            alt={inspiration.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 768px, 100vw"
            priority
          />
        </div>
      )}

      <div
        className="prose prose-neutral mt-8 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(inspiration.content) }}
      />

      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={`/inspirations/${inspiration.slug}`} title={inspiration.title} />
      </div>
    </article>
  );
}
