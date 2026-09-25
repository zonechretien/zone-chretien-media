"use client";

import { useState, useTransition } from "react";
import { FORMATS, FORMAT_IDS, type FormatId } from "@reels/formats";
import { TEMPLATE_METAS, type TemplateId } from "@reels/template-meta";
import { FieldLabel, FormActions, FormRow, inputClass } from "@/components/admin/form-fields";
import { CancelLink, SubmitButton } from "@/components/admin/submit-button";
import type { ReelLanguage } from "@reels/schemas";
import { createReel } from "@/lib/actions/reels";
import { LANGUAGE_LABELS } from "./voice-sync-panel";
import { cn } from "@/lib/utils";

export function NewReelForm() {
  const templateIds = Object.keys(TEMPLATE_METAS) as TemplateId[];
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>(templateIds[0]);
  const [format, setFormat] = useState<FormatId>("9:16");
  const [language, setLanguage] = useState<ReelLanguage>("fr");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const meta = TEMPLATE_METAS[templateId];

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createReel({ title, templateId, format, language });
          if (result?.error) setError(result.error);
        });
      }}
    >
      <FormRow>
        <FieldLabel htmlFor="title" required>Titre du projet</FieldLabel>
        <input id="title" className={inputClass} value={title} maxLength={120} placeholder="Ex. Verset du lundi — Psaume 34" onChange={(e) => setTitle(e.target.value)} />
      </FormRow>

      <fieldset className="mb-5">
        <legend className="mb-1.5 block text-sm font-medium text-foreground">Template</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup">
          {templateIds.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={id === templateId}
              onClick={() => setTemplateId(id)}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                id === templateId ? "border-gold bg-gold/10 ring-2 ring-gold/30" : "border-border hover:border-gold",
              )}
            >
              <span className="block font-semibold text-foreground">{TEMPLATE_METAS[id].label}</span>
              <span className="mt-1 block text-sm text-foreground/70">{TEMPLATE_METAS[id].description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="mb-1.5 block text-sm font-medium text-foreground">Format</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {FORMAT_IDS.map((id) => {
            const available = meta.formats.includes(id);
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={id === format}
                disabled={!available}
                onClick={() => setFormat(id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                  id === format ? "bg-navy font-semibold text-white" : "border border-border text-foreground/80 hover:border-gold",
                )}
              >
                {FORMATS[id].label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="mb-1.5 block text-sm font-medium text-foreground">Langue du Reel</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {(Object.keys(LANGUAGE_LABELS) as ReelLanguage[]).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={l === language}
              onClick={() => setLanguage(l)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                l === language ? "bg-navy font-semibold text-white" : "border border-border text-foreground/80 hover:border-gold",
              )}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">Accroche et appel à l&apos;action proposés dans cette langue ; les textes d&apos;exemple restent en français.</p>
      </fieldset>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <FormActions>
        <SubmitButton pending={pending} label="Créer et ouvrir l'éditeur" />
        <CancelLink href="/admin/reels" />
      </FormActions>
    </form>
  );
}
