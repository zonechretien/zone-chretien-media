import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReadingPlanBySlug } from "@/lib/queries/reading-plans";
import { PageHeader } from "@/components/shared/page-header";
import { ReadingPlanDetailView } from "@/components/bible/reading-plan-detail-view";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plan = await getReadingPlanBySlug(slug);
  if (!plan) return {};

  return pageMetadata({
    title: plan.metaTitle || `${plan.title} — Plan de lecture`,
    description: plan.metaDescription || plan.description || `Un plan de lecture biblique sur ${plan.durationDays} jours.`,
    path: `/bible/plans/${plan.slug}`,
    image: plan.coverImageUrl ?? undefined,
  });
}

export default async function ReadingPlanDetailPage({ params }: Props) {
  const { slug } = await params;
  const plan = await getReadingPlanBySlug(slug);
  if (!plan) notFound();

  return (
    <div>
      <PageHeader title={plan.title} description={plan.description ?? undefined} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <ReadingPlanDetailView plan={plan} />
      </div>
    </div>
  );
}
