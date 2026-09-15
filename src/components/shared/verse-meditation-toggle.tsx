"use client";

import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerseMeditation, type VerseMeditationData } from "@/components/shared/verse-meditation";

/** Variante repliée : la carte du verset reste seule au premier regard. */
export function VerseMeditationToggle({ meditation }: { meditation: VerseMeditationData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/30 px-5 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/5 dark:text-gold-soft"
      >
        <BookOpen size={16} />
        Lire la méditation du jour
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-8">
          <VerseMeditation meditation={meditation} />
        </div>
      )}
    </div>
  );
}
