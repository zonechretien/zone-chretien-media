"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Devotion } from "@prisma/client";
import { devotionSchema, type DevotionInput } from "@/lib/validations/devotions";
import { createDevotion, updateDevotion } from "@/lib/actions/devotions";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
import { useAIDraftPrefill } from "@/lib/admin/use-ai-draft";
import type { DevotionDraft } from "@/lib/ai/schemas";
import { slugify } from "@/lib/utils";
import {
  FieldError,
  FieldLabel,
  FormActions,
  FormGrid,
  FormRow,
  checkboxClass,
  inputClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { ImageUrlField } from "@/components/admin/image-url-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";
import { dateToUrlSlug } from "@/lib/utils";

export function DevotionForm({ devotion }: { devotion?: Devotion }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DevotionInput>({
    resolver: zodResolver(devotionSchema),
    defaultValues: devotion
      ? {
          title: devotion.title,
          slug: devotion.slug,
          mainVerseRef: devotion.mainVerseRef,
          mainVerseText: devotion.mainVerseText,
          reflection: devotion.reflection,
          application: devotion.application,
          prayer: devotion.prayer,
          imageUrl: devotion.imageUrl ?? "",
          date: dateToUrlSlug(devotion.date),
          published: devotion.published,
        }
      : { published: true, date: dateToUrlSlug(new Date()) },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!devotion);

  useAIDraftPrefill<DevotionDraft>("ai-draft-devotion", (draft) => {
    if (devotion) return;
    reset({
      title: draft.title,
      slug: slugify(draft.title),
      mainVerseRef: draft.mainVerseRef,
      mainVerseText: draft.mainVerseText,
      reflection: draft.reflection,
      application: draft.application,
      prayer: draft.prayer,
      imageUrl: "",
      date: dateToUrlSlug(new Date()),
      published: true,
    });
  });

  function onSubmit(data: DevotionInput) {
    setServerError(null);
    startTransition(async () => {
      const result = devotion ? await updateDevotion(devotion.id, data) : await createDevotion(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="title" required>Titre</FieldLabel>
          <input id="title" className={inputClass} {...register("title")} />
          <FieldError error={errors.title} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="slug" required>Slug</FieldLabel>
          <input id="slug" className={inputClass} {...register("slug", { onChange: onSlugManualEdit })} />
          <FieldError error={errors.slug} />
        </FormRow>
      </FormGrid>

      <FormRow>
        <FieldLabel htmlFor="date" required>Date</FieldLabel>
        <input id="date" type="date" className={inputClass} {...register("date")} />
        <FieldError error={errors.date} />
      </FormRow>

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="mainVerseRef" required>Référence du verset</FieldLabel>
          <input id="mainVerseRef" className={inputClass} placeholder="Ex. Jean 3:16" {...register("mainVerseRef")} />
          <FieldError error={errors.mainVerseRef} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="mainVerseText" required>Texte du verset</FieldLabel>
          <input id="mainVerseText" className={inputClass} {...register("mainVerseText")} />
          <FieldError error={errors.mainVerseText} />
        </FormRow>
      </FormGrid>

      <FormRow>
        <FieldLabel htmlFor="reflection" required>Réflexion</FieldLabel>
        <textarea id="reflection" className={textareaClass} rows={5} {...register("reflection")} />
        <FieldError error={errors.reflection} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="application" required>Application pratique</FieldLabel>
        <textarea id="application" className={textareaClass} {...register("application")} />
        <FieldError error={errors.application} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="prayer" required>Prière</FieldLabel>
        <textarea id="prayer" className={textareaClass} {...register("prayer")} />
        <FieldError error={errors.prayer} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="imageUrl">Image (URL)</FieldLabel>
        <ImageUrlField register={register("imageUrl")} defaultValue={devotion?.imageUrl ?? undefined} />
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
        <CancelLink href="/admin/devotions" />
      </FormActions>
    </form>
  );
}
