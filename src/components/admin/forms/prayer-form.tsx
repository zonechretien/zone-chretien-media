"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Prayer } from "@prisma/client";
import {
  prayerSchema,
  type PrayerInput,
  PRAYER_CATEGORIES,
  PRAYER_CATEGORY_LABELS,
} from "@/lib/validations/prayers";
import { createPrayer, updatePrayer } from "@/lib/actions/prayers";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
import { useAIDraftPrefill } from "@/lib/admin/use-ai-draft";
import { slugify, dateToUrlSlug } from "@/lib/utils";
import {
  FieldError,
  FieldLabel,
  FormActions,
  FormGrid,
  FormRow,
  checkboxClass,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { ImageUrlField } from "@/components/admin/image-url-field";
import { PublishedAtField } from "@/components/admin/published-at-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export function PrayerForm({ prayer }: { prayer?: Prayer }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PrayerInput>({
    resolver: zodResolver(prayerSchema),
    defaultValues: prayer
      ? {
          title: prayer.title,
          slug: prayer.slug,
          content: prayer.content,
          category: prayer.category,
          imageUrl: prayer.imageUrl ?? "",
          publishedAt: dateToUrlSlug(prayer.publishedAt ?? prayer.createdAt),
          published: prayer.published,
        }
      : { published: true, category: "MORNING", publishedAt: dateToUrlSlug(new Date()) },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!prayer);

  useAIDraftPrefill<{ title: string; content: string; category: PrayerInput["category"] }>(
    "ai-draft-prayer",
    (draft) => {
      if (prayer) return;
      reset({
        title: draft.title,
        slug: slugify(draft.title),
        content: draft.content,
        category: draft.category,
        imageUrl: "",
        published: true,
        publishedAt: dateToUrlSlug(new Date()),
      });
    },
  );

  function onSubmit(data: PrayerInput) {
    setServerError(null);
    startTransition(async () => {
      const result = prayer ? await updatePrayer(prayer.id, data) : await createPrayer(data);
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
        <FieldLabel htmlFor="category" required>Catégorie</FieldLabel>
        <select id="category" className={selectClass} {...register("category")}>
          {PRAYER_CATEGORIES.map((c) => (
            <option key={c} value={c}>{PRAYER_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <FieldError error={errors.category} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="content" required>Contenu</FieldLabel>
        <textarea id="content" className={textareaClass} rows={6} {...register("content")} />
        <FieldError error={errors.content} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="imageUrl">Image (URL)</FieldLabel>
        <ImageUrlField register={register("imageUrl")} defaultValue={prayer?.imageUrl ?? undefined} />
      </FormRow>

      <FormRow>
        <PublishedAtField register={register("publishedAt")} />
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
        <CancelLink href="/admin/prieres" />
      </FormActions>
    </form>
  );
}
