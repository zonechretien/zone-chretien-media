"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BookMarked, Loader2, Sparkles } from "lucide-react";
import { generateDevotionAction } from "@/lib/actions/ai";
import type { DevotionDraft } from "@/lib/ai/schemas";
import { GeneratorShell } from "./generator-shell";
import { CopyButton } from "./copy-button";
import { inputClass } from "@/components/admin/form-fields";

export function DevotionGenerator() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<DevotionDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateDevotionAction(topic || undefined);
      if ("error" in result) setError(result.error);
      else setDraft(result.data);
    });
  }

  function handleUseDraft() {
    if (!draft) return;
    sessionStorage.setItem("ai-draft-devotion", JSON.stringify(draft));
    router.push("/admin/devotions/nouveau?ia=1");
  }

  return (
    <GeneratorShell
      icon={BookMarked}
      title="Dévotion"
      description="Verset, réflexion, application pratique et prière générés automatiquement."
    >
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Thème (optionnel — ex. la persévérance)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
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
          <p className="font-semibold text-foreground">{draft.title}</p>
          <p className="text-gold">{draft.mainVerseRef} — {draft.mainVerseText}</p>
          <p className="text-foreground/80">{draft.reflection}</p>
          <p className="text-foreground/80"><strong>Application :</strong> {draft.application}</p>
          <p className="text-foreground/80"><strong>Prière :</strong> {draft.prayer}</p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleUseDraft}
              className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-gold-soft"
            >
              Créer cette dévotion
            </button>
            <CopyButton
              text={`${draft.title}\n${draft.mainVerseRef} — ${draft.mainVerseText}\n\n${draft.reflection}\n\nApplication : ${draft.application}\n\nPrière : ${draft.prayer}`}
            />
          </div>
        </div>
      )}
    </GeneratorShell>
  );
}
