import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getResourceBySlug } from "@/lib/queries/resources";
import { prisma } from "@/lib/db";
import { BookReader } from "@/components/resources/book-reader";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const FALLBACK_CONTACT_EMAIL = "nousezonechretien@gmail.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);
  if (!resource || resource.type !== "BOOK") return {};

  return pageMetadata({
    title: `Lire un extrait — ${resource.title}`,
    description: `Aperçu gratuit du livre « ${resource.title} » sur Zone-Chrétien Media.`,
    path: `/bibliotheque/${resource.slug}/lire`,
    noIndex: true,
  });
}

export default async function LireExtraitPage({ params }: Props) {
  const { slug } = await params;
  const [resource, settings] = await Promise.all([
    getResourceBySlug(slug),
    prisma.settings.findUnique({ where: { id: "settings" } }),
  ]);

  if (!resource || resource.type !== "BOOK") notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <BookReader
        fileUrl={resource.fileUrl}
        title={resource.title}
        coverImageUrl={resource.coverImageUrl}
        freePreviewPages={resource.freePreviewPages}
        detailHref={`/bibliotheque/${resource.slug}`}
        contactEmail={settings?.contactEmail ?? FALLBACK_CONTACT_EMAIL}
      />
    </div>
  );
}
