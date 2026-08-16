"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HandHeart, Loader2, Sparkles } from "lucide-react";
import { generatePrayerAction } from "@/lib/actions/ai";
import type { PrayerDraft } from "@/lib/ai/schemas";
import { PRAYER_CATEGORIES, PRAYER_CATEGORY_LABELS } from "@/lib/validations/prayers";
import { GeneratorShell } from "./generator-shell";
import { CopyButton } from "./copy-button";
import { inputClass, selectClass } from "@/components/admin/form-fields";

export function PrayerGenerator() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof PRAYER_CATEGORIES)[number]>("MORNING");
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<PrayerDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generatePrayerAction(PRAYER_CATEGORY_LABELS[category], topic || undefined);
      if ("error" in result) setError(result.error);
      else setDraft(result.data);
    });
  }

  function handleUseDraft() {
    if (!draft) return;
    sessionStorage.setItem("ai-draft-prayer", JSON.stringify({ ...draft, category }));
    router.push("/admin/prieres/nouveau?ia=1");
  }

  return (
    <GeneratorShell icon={HandHeart} title="Prière" description="Une prière prête à publier, par catégorie.">
      <div className="flex flex-wrap gap-2">
        <select
          className={`${selectClass} w-auto`}
          value={category}
          onChange={(e) => setCategory(e.target.value as (typeof PRAYER_CATEGORIES)[number])}
        >
          {PRAYER_CATEGORIES.map((c) => (
            <option key={c} value={c}>{PRAYER_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <input
          className={`${inputClass} flex-1`}
          placeholder="Sujet (optionnel)"
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
          <p className="whitespace-pre-line text-foreground/80">{draft.content}</p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleUseDraft}
              className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-gold-soft"
            >
              Créer cette prière
            </button>
            <CopyButton text={`${draft.title}\n\n${draft.content}`} />
          </div>
        </div>
      )}
    </GeneratorShell>
  );
}
