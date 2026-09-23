"use client";

import { BookOpen, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { lookupBiblePassage } from "@/lib/actions/bible-reels";

/**
 * Bouton « Insérer le texte LSG 1910 » d'un champ de référence biblique :
 * met la référence en forme et remplit le champ de texte associé.
 */
export function BibleInsert({
  reference,
  maxTextLength,
  onInsert,
}: {
  reference: string;
  /** Longueur maximale acceptée par le champ de texte du template. */
  maxTextLength?: number;
  onInsert: (formattedReference: string, text: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);

  function insert() {
    setMessage(null);
    startTransition(async () => {
      const result = await lookupBiblePassage(reference);
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      const { passage } = result;
      if (maxTextLength && passage.text.length > maxTextLength) {
        setMessage({
          kind: "error",
          text: `${passage.reference} est trop long pour un Reel (${passage.text.length} caractères, ${maxTextLength} au maximum). Choisissez moins de versets.`,
        });
        return;
      }
      onInsert(passage.reference, passage.text);
      const count = `${passage.verseCount} verset${passage.verseCount > 1 ? "s" : ""}`;
      setMessage(
        passage.includesPsalmTitle
          ? { kind: "warn", text: `${count} inséré${passage.verseCount > 1 ? "s" : ""}. Le verset 1 de ce psaume commence par son titre (ex. « Cantique de David. ») : retirez-le du texte si besoin.` }
          : { kind: "ok", text: `${count} inséré${passage.verseCount > 1 ? "s" : ""} (Louis Segond 1910).` },
      );
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={insert}
        disabled={pending || !reference.trim()}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-gold hover:text-gold disabled:opacity-50"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
        Insérer le texte LSG 1910
      </button>
      {message && (
        <p
          aria-live="polite"
          className={
            message.kind === "error" ? "mt-1 text-sm text-red-500" : message.kind === "warn" ? "mt-1 text-sm text-amber-600" : "mt-1 text-sm text-emerald-600"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
