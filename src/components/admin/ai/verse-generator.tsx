"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Quote, Sparkles } from "lucide-react";
import { generateVerseAction } from "@/lib/actions/ai";
import type { VerseDraft } from "@/lib/ai/schemas";
import { GeneratorShell } from "./generator-shell";
import { CopyButton } from "./copy-button";
import { inputClass } from "@/components/admin/form-fields";

export function VerseGenerator() {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [draft, setDraft] = useState<VerseDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateVerseAction(theme || undefined);
      if ("error" in result) setError(result.error);
      else setDraft(result.data);
    });
  }

  function handleUseDraft() {
    if (!draft) return;
    sessionStorage.setItem("ai-draft-verse", JSON.stringify(draft));
    router.push("/admin/versets/nouveau?ia=1");
  }

  return (
    <GeneratorShell
      icon={Quote}
      title="Verset du jour"
      description="Référence, texte et explication, prêts à publier."
    >
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Thème (optionnel — ex. l'espérance)"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Générer
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {draft && (
        <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="font-semibold text-gold">{draft.reference}</p>
          <p className="text-foreground/80">« {draft.text} »</p>
          <p className="text-foreground/80">{draft.explanation}</p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleUseDraft}
              className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-gold-soft"
            >
              Créer ce verset
            </button>
            <CopyButton text={`${draft.reference}\n« ${draft.text} »\n\n${draft.explanation}`} />
          </div>
        </div>
      )}
    </GeneratorShell>
  );
}
