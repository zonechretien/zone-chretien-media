"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, Inspiration } from "@prisma/client";
import { inspirationSchema, type InspirationInput } from "@/lib/validations/inspirations";
import { createInspiration, updateInspiration } from "@/lib/actions/inspirations";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
import { useAIDraftPrefill } from "@/lib/admin/use-ai-draft";
import type { InspirationDraft } from "@/lib/ai/schemas";
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
import { YoutubeEmbedCheck } from "@/components/admin/youtube-embed-check";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export function InspirationForm({
  inspiration,
  categories,
}: {
  inspiration?: Inspiration;
  categories: Category[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InspirationInput>({
    resolver: zodResolver(inspirationSchema),
    defaultValues: inspiration
      ? {
          title: inspiration.title,
          slug: inspiration.slug,
          content: inspiration.content,
          imageUrl: inspiration.imageUrl ?? "",
          videoUrl: inspiration.videoUrl ?? "",
          author: inspiration.author ?? "",
          categoryId: inspiration.categoryId ?? "",
          publishedAt: dateToUrlSlug(inspiration.publishedAt ?? inspiration.createdAt),
          published: inspiration.published,
        }
      : { published: true, publishedAt: dateToUrlSlug(new Date()) },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!inspiration);
  const videoUrlValue = watch("videoUrl");

  useAIDraftPrefill<InspirationDraft>("ai-draft-inspiration", (draft) => {
    if (inspiration) return;
    reset({
      title: draft.title,
      slug: slugify(draft.title),
      content: draft.content,
      imageUrl: "",
      videoUrl: "",
      author: "",
      categoryId: "",
      published: true,
      publishedAt: dateToUrlSlug(new Date()),
    });
  });

  function onSubmit(data: InspirationInput) {
    setServerError(null);
    startTransition(async () => {
      const result = inspiration
        ? await updateInspiration(inspiration.id, data)
        : await createInspiration(data);
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
        <FieldLabel htmlFor="content" required>Contenu</FieldLabel>
        <textarea id="content" className={textareaClass} rows={6} {...register("content")} />
        <FieldError error={errors.content} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="imageUrl">Image (URL)</FieldLabel>
        <ImageUrlField register={register("imageUrl")} defaultValue={inspiration?.imageUrl ?? undefined} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="videoUrl">URL YouTube (optionnel)</FieldLabel>
        <input id="videoUrl" className={inputClass} placeholder="https://youtube.com/…" {...register("videoUrl")} />
        <FieldError error={errors.videoUrl} />
        <YoutubeEmbedCheck url={videoUrlValue ?? ""} />
      </FormRow>

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="author">Auteur</FieldLabel>
          <input id="author" className={inputClass} {...register("author")} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="categoryId">Catégorie</FieldLabel>
          <select id="categoryId" className={selectClass} {...register("categoryId")}>
            <option value="">Aucune</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormRow>
      </FormGrid>

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
        <CancelLink href="/admin/inspirations" />
      </FormActions>
    </form>
  );
}
