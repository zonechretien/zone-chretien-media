"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { RankingRow } from "./ranking-row";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { Track } from "@/components/shared/audio-player-provider";

export type RankedSong = { track: Track; views: number };

export function RankingTabs({ weekly, allTime }: { weekly: RankedSong[]; allTime: RankedSong[] }) {
  const [tab, setTab] = useState<"week" | "all">("week");
  const active = tab === "week" ? weekly : allTime;

  return (
    <div>
      <div className="mb-6 flex w-fit gap-1 rounded-full bg-brand-off-white p-1">
        <button
          type="button"
          onClick={() => setTab("week")}
          className={cn(
            "rounded-full px-4 py-2 font-body text-sm font-semibold transition",
            tab === "week" ? "bg-brand-navy text-white" : "text-brand-gray-dark hover:text-brand-text",
          )}
        >
          Top 10 de la semaine
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          className={cn(
            "rounded-full px-4 py-2 font-body text-sm font-semibold transition",
            tab === "all" ? "bg-brand-navy text-white" : "text-brand-gray-dark hover:text-brand-text",
          )}
        >
          Top 10 depuis toujours
        </button>
      </div>

      {active.length > 0 ? (
        <div className="rounded-2xl bg-brand-white px-5 shadow-brand-sm sm:px-6">
          {active.map((item, i) => (
            <RankingRow key={item.track.id} rank={i + 1} track={item.track} views={item.views} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Aucune donnée pour cette période"
          description="Revenez bientôt : le classement se remplit au fil des vues."
        />
      )}
    </div>
  );
}
