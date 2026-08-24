import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HandHeart } from "lucide-react";
import { getPrayerBySlug } from "@/lib/queries/prayers";
import { trackView } from "@/lib/queries/shared";
import { PRAYER_CATEGORY_LABELS } from "@/lib/validations/prayers";
import { ShareButtons } from "@/components/shared/share-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { renderMarkdown, markdownToText } from "@/lib/markdown";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prayer = await getPrayerBySlug(slug);
  if (!prayer) return {};

  const description = markdownToText(prayer.content).slice(0, 160);

  return {
    title: prayer.title,
    description,
    alternates: { canonical: `/prieres/${prayer.slug}` },
    openGraph: {
      title: prayer.title,
      description,
      type: "article",
      url: `/prieres/${prayer.slug}`,
    },
    twitter: { card: "summary_large_image", title: prayer.title, description },
  };
}

export default async function PrayerPage({ params }: Props) {
  const { slug } = await params;
  const prayer = await getPrayerBySlug(slug);
  if (!prayer) notFound();

  trackView("PRAYER", prayer.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: prayer.title,
          headline: prayer.title,
          description: markdownToText(prayer.content).slice(0, 160),
          about: PRAYER_CATEGORY_LABELS[prayer.category],
          datePublished: prayer.createdAt.toISOString(),
          url: absoluteUrl(`/prieres/${prayer.slug}`),
        }}
      />
      <span className="flex w-fit items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
        <HandHeart size={12} /> {PRAYER_CATEGORY_LABELS[prayer.category]}
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {prayer.title}
      </h1>
      <div
        className="prose prose-neutral mt-8 max-w-none leading-relaxed text-foreground/90 dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(prayer.content) }}
      />
      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={`/prieres/${prayer.slug}`} title={prayer.title} />
      </div>
    </article>
  );
}
