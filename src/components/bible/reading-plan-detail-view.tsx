"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Circle, Loader2, Star } from "lucide-react";
import type { ReadingPlan, ReadingPlanDay, ReadingPlanPassage } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useActivePlan, startPlan, toggleDayRead, getNextDay } from "@/lib/personalization";
import { getReadingPlanDayTextAction, type ReadingPlanDayText } from "@/lib/actions/bible";

type PlanWithDays = ReadingPlan & { days: (ReadingPlanDay & { passages: ReadingPlanPassage[] })[] };

export function ReadingPlanDetailView({ plan }: { plan: PlanWithDays }) {
  const active = useActivePlan(plan.slug);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [dayText, setDayText] = useState<ReadingPlanDayText | null>(null);
  const [pending, startTransition] = useTransition();

  const daysRead = active?.daysRead ?? [];
  const nextDay = getNextDay(daysRead, plan.durationDays);
  const started = !!active;

  function handleStart() {
    startPlan(plan.slug);
  }

  function toggleDay(day: PlanWithDays["days"][number]) {
    if (expandedDayId === day.id) {
      setExpandedDayId(null);
      return;
    }
    setExpandedDayId(day.id);
    setDayText(null);
    startTransition(async () => {
      const text = await getReadingPlanDayTextAction(day.id);
      setDayText(text);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {daysRead.length}/{plan.durationDays} jours lus
        </p>
        {!started ? (
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
          >
            Commencer ce plan
          </button>
        ) : nextDay === null ? (
          <span className="rounded-full bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">
            Plan terminé 🎉
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground">Jour {nextDay} à suivre</span>
        )}
      </div>

      <div className="space-y-2">
        {plan.days.map((day) => {
          const isRead = daysRead.includes(day.dayNumber);
          const isRecommended = started && nextDay === day.dayNumber;
          const isExpanded = expandedDayId === day.id;

          return (
            <div key={day.id} className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface",
                  isRecommended && "bg-gold/5",
                )}
              >
                <div className="flex items-center gap-3">
                  {isRead ? (
                    <Check size={16} className="shrink-0 text-gold" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-muted" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      Jour {day.dayNumber}
                      {isRecommended && (
                        <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
                          Recommandé
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {day.passages.map((p) => `${p.bookName} ${p.chapterStart}-${p.chapterEnd}`).join(" · ")}
                    </p>
                  </div>
                </div>
                <ChevronDown size={16} className={cn("shrink-0 text-muted transition", isExpanded && "rotate-180")} />
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-4">
                  {pending && !dayText ? (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <Loader2 size={14} className="animate-spin" /> Chargement du texte…
                    </p>
                  ) : (
                    <>
                      {(dayText ?? []).map((passage, i) => (
                        <div key={i} className="mb-4 last:mb-0">
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
                            {passage.bookName} {passage.chapterStart}
                            {passage.chapterEnd !== passage.chapterStart ? `-${passage.chapterEnd}` : ""}
                          </p>
                          {passage.chapters.map((chapter) => (
                            <div key={chapter.number} className="mb-2 space-y-1">
                              {passage.chapters.length > 1 && (
                                <p className="text-xs font-medium text-muted">Chapitre {chapter.number}</p>
                              )}
                              {chapter.verses.map((verse) => (
                                <p key={verse.number} className="text-sm leading-relaxed text-foreground/90">
                                  <sup className="mr-1 font-semibold text-gold">{verse.number}</sup>
                                  {verse.text}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => toggleDayRead(plan.slug, day.dayNumber)}
                        className={cn(
                          "mt-2 flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
                          isRead
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border text-foreground/70 hover:border-gold hover:text-gold",
                        )}
                      >
                        <Star size={14} fill={isRead ? "currentColor" : "none"} />
                        {isRead ? "Marqué comme lu" : "Marquer comme lu"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
