"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Verse } from "@prisma/client";
import { verseSchema, type VerseInput } from "@/lib/validations/verses";
import { createVerse, updateVerse } from "@/lib/actions/verses";
import { useAIDraftPrefill } from "@/lib/admin/use-ai-draft";
import type { VerseDraft } from "@/lib/ai/schemas";
import {
  FieldError,
  FieldLabel,
  FormActions,
  FormRow,
  checkboxClass,
  inputClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { ImageUrlField } from "@/components/admin/image-url-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";
import { dateToUrlSlug } from "@/lib/utils";

export function VerseForm({ verse }: { verse?: Verse }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VerseInput>({
    resolver: zodResolver(verseSchema),
    defaultValues: verse
      ? {
          reference: verse.reference,
          text: verse.text,
          explanation: verse.explanation ?? "",
          imageUrl: verse.imageUrl ?? "",
          date: dateToUrlSlug(verse.date),
          published: verse.published,
        }
      : { published: true, date: dateToUrlSlug(new Date()) },
  });

  useAIDraftPrefill<VerseDraft>("ai-draft-verse", (draft) => {
    if (verse) return;
    reset({
      reference: draft.reference,
      text: draft.text,
      explanation: draft.explanation,
      imageUrl: "",
      date: dateToUrlSlug(new Date()),
      published: true,
    });
  });

  function onSubmit(data: VerseInput) {
    setServerError(null);
    startTransition(async () => {
      const result = verse ? await updateVerse(verse.id, data) : await createVerse(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormRow>
        <FieldLabel htmlFor="date" required>Date</FieldLabel>
        <input id="date" type="date" className={inputClass} {...register("date")} />
        <FieldError error={errors.date} />
        <p className="mt-1 text-xs text-muted">Un seul verset par date.</p>
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="reference" required>Référence biblique</FieldLabel>
        <input id="reference" className={inputClass} placeholder="Ex. Jean 3:16" {...register("reference")} />
        <FieldError error={errors.reference} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="text" required>Texte du verset</FieldLabel>
        <textarea id="text" className={textareaClass} {...register("text")} />
        <FieldError error={errors.text} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="explanation">Explication</FieldLabel>
        <textarea id="explanation" className={textareaClass} {...register("explanation")} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="imageUrl">Image (URL, optionnel)</FieldLabel>
        <ImageUrlField register={register("imageUrl")} defaultValue={verse?.imageUrl ?? undefined} />
        <p className="mt-1 text-xs text-muted">
          Une image partageable est aussi générée automatiquement pour chaque verset.
        </p>
      </FormRow>

      <FormRow>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className={checkboxClass} defaultChecked {...register("published")} /> Publié
        </label>
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/versets" />
      </FormActions>
    </form>
  );
}
