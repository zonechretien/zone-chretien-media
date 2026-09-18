import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { getReadingPlans } from "@/lib/queries/reading-plans";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ReadingPlanProgressBar } from "@/components/bible/reading-plan-progress-bar";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Plans de lecture",
  description: "Des plans de lecture biblique pour vous accompagner jour après jour dans la Parole.",
  path: "/bible/plans",
});

export default async function ReadingPlansPage() {
  const plans = await getReadingPlans();

  return (
    <div>
      <PageHeader
        title="Plans de lecture"
        description="Avancez pas à pas dans la Parole avec un plan de lecture quotidien."
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {plans.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/bible/plans/${plan.slug}`}
                className="overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold"
              >
                <div className="relative aspect-[16/7] w-full bg-surface">
                  {plan.coverImageUrl && (
                    <Image
                      src={plan.coverImageUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-foreground">{plan.title}</h2>
                  {plan.description && <p className="mt-1 text-sm text-muted">{plan.description}</p>}
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {plan.durationDays} jours
                  </p>
                  <ReadingPlanProgressBar slug={plan.slug} durationDays={plan.durationDays} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarRange}
            title="Aucun plan de lecture pour le moment"
            description="Les prochains plans apparaîtront ici dès leur publication."
          />
        )}
      </div>
    </div>
  );
}
