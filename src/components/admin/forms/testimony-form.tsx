"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Testimony } from "@prisma/client";
import { testimonySchema, type TestimonyInput } from "@/lib/validations/testimonies";
import { createTestimony, updateTestimony } from "@/lib/actions/testimonies";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
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
import { PublishedAtField } from "@/components/admin/published-at-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";
import { dateToUrlSlug } from "@/lib/utils";

export function TestimonyForm({ testimony }: { testimony?: Testimony }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TestimonyInput>({
    resolver: zodResolver(testimonySchema),
    defaultValues: testimony
      ? {
          title: testimony.title,
          slug: testimony.slug,
          content: testimony.content,
          authorName: testimony.authorName,
          imageUrl: testimony.imageUrl ?? "",
          publishedAt: dateToUrlSlug(testimony.publishedAt ?? testimony.createdAt),
          published: testimony.published,
        }
      : { published: true, publishedAt: dateToUrlSlug(new Date()) },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!testimony);

  function onSubmit(data: TestimonyInput) {
    setServerError(null);
    startTransition(async () => {
      const result = testimony ? await updateTestimony(testimony.id, data) : await createTestimony(data);
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
        <FieldLabel htmlFor="authorName" required>Nom de l&apos;auteur</FieldLabel>
        <input id="authorName" className={inputClass} {...register("authorName")} />
        <FieldError error={errors.authorName} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="content" required>Contenu</FieldLabel>
        <textarea id="content" className={textareaClass} rows={7} {...register("content")} />
        <FieldError error={errors.content} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="imageUrl">Photo de l&apos;auteur (URL)</FieldLabel>
        <ImageUrlField register={register("imageUrl")} defaultValue={testimony?.imageUrl ?? undefined} />
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
        <CancelLink href="/admin/temoignages" />
      </FormActions>
    </form>
  );
}
