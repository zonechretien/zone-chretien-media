"use client";

import Link from "next/link";
import { CalendarRange, ChevronRight } from "lucide-react";
import { useActivePlans, getNextDay } from "@/lib/personalization";

export type ContinuablePlan = {
  slug: string;
  title: string;
  durationDays: number;
  coverImageUrl: string | null;
};

export function ContinueReadingPlanBlock({ plans }: { plans: ContinuablePlan[] }) {
  const activePlans = useActivePlans();

  const inProgress = activePlans
    .map((active) => {
      const plan = plans.find((p) => p.slug === active.planSlug);
      if (!plan) return null;
      const nextDay = getNextDay(active.daysRead, plan.durationDays);
      if (nextDay === null) return null; // plan terminé
      return { plan, nextDay, daysReadCount: active.daysRead.length };
    })
    .filter((item) => item !== null);

  if (inProgress.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <CalendarRange size={18} className="text-gold" />
        Continuer mon plan de lecture
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {inProgress.map(({ plan, nextDay, daysReadCount }) => (
          <Link
            key={plan.slug}
            href={`/bible/plans/${plan.slug}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-elevated px-5 py-4 transition hover:border-gold"
          >
            <div>
              <p className="font-semibold text-foreground">{plan.title}</p>
              <p className="mt-0.5 text-sm text-muted">
                {daysReadCount}/{plan.durationDays} jours lus — Jour {nextDay} à suivre
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-gold" />
          </Link>
        ))}
      </div>
    </section>
  );
}
