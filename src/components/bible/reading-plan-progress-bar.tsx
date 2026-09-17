"use client";

import { useActivePlan } from "@/lib/personalization";

export function ReadingPlanProgressBar({ slug, durationDays }: { slug: string; durationDays: number }) {
  const active = useActivePlan(slug);
  if (!active) return null;

  const percent = Math.round((active.daysRead.length / durationDays) * 100);

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {active.daysRead.length}/{durationDays} jours — {percent}%
      </p>
    </div>
  );
}
