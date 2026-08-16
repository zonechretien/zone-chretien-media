import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, UserRound } from "lucide-react";
import { getTestimonyBySlug } from "@/lib/queries/testimonies";
import { trackView } from "@/lib/queries/shared";
import { formatDate } from "@/lib/utils";
import { ShareButtons } from "@/components/shared/share-buttons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const testimony = await getTestimonyBySlug(slug);
  if (!testimony) return {};

  const description = testimony.content.slice(0, 160);

  return {
    title: testimony.title,
    description,
    alternates: { canonical: `/temoignages/${testimony.slug}` },
    openGraph: {
      title: testimony.title,
      description,
      images: testimony.imageUrl ? [testimony.imageUrl] : undefined,
      type: "article",
      url: `/temoignages/${testimony.slug}`,
    },
    twitter: { card: "summary_large_image", title: testimony.title, description },
  };
}

export default async function TestimonyPage({ params }: Props) {
  const { slug } = await params;
  const testimony = await getTestimonyBySlug(slug);
  if (!testimony) notFound();

  trackView("TESTIMONY", testimony.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: testimony.title,
          headline: testimony.title,
          description: testimony.content.slice(0, 160),
          image: testimony.imageUrl ?? undefined,
          author: { "@type": "Person", name: testimony.authorName },
          datePublished: testimony.createdAt.toISOString(),
          url: absoluteUrl(`/temoignages/${testimony.slug}`),
        }}
      />
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-navy">
          {testimony.imageUrl ? (
            <Image src={testimony.imageUrl} alt={testimony.authorName} fill className="object-cover" sizes="48px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gold">
              <UserRound size={20} />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-foreground">{testimony.authorName}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <Calendar size={12} /> {formatDate(testimony.createdAt)}
          </p>
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {testimony.title}
      </h1>

      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line leading-relaxed text-foreground/90 dark:prose-invert">
        {testimony.content}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={`/temoignages/${testimony.slug}`} title={testimony.title} />
      </div>
    </article>
  );
}
