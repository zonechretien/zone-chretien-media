"use client";

import { cn } from "@/lib/utils";

export type NowPlayingTabKey = "queue" | "lyrics" | "comments";

const TABS: { key: NowPlayingTabKey; label: string }[] = [
  { key: "queue", label: "À suivre" },
  { key: "lyrics", label: "Paroles" },
  { key: "comments", label: "Commentaire" },
];

export function NowPlayingTabs({
  active,
  onChange,
}: {
  active: NowPlayingTabKey;
  onChange: (tab: NowPlayingTabKey) => void;
}) {
  return (
    <div role="tablist" aria-label="Panneau de lecture" className="flex border-b border-brand-gray-light">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`now-playing-tab-${tab.key}`}
          aria-selected={active === tab.key}
          aria-controls={`now-playing-panel-${tab.key}`}
          onClick={() => onChange(tab.key)}
          className={cn(
            "flex-1 border-b-2 px-3 py-3 text-center font-body text-[12px] font-bold uppercase tracking-wide transition",
            active === tab.key
              ? "border-brand-gold text-brand-gold"
              : "border-transparent text-brand-gray-dark hover:text-brand-text",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
