"use client";

import { Clapperboard, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createReelFromContent } from "@/lib/actions/reels";
import type { ReelSourceType } from "@/lib/reels/sources";

/** Bouton client : crée le Reel prérempli puis ouvre l'éditeur (redirection). */
export function TransformToReelButton({ sourceType, sourceId }: { sourceType: ReelSourceType; sourceId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await createReelFromContent(sourceType, sourceId);
            if (result?.error) setError(result.error);
          })
        }
        className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Clapperboard size={16} />}
        Transformer en Reel
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
