"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Tag } from "@prisma/client";
import { tagSchema, type TagInput } from "@/lib/validations/categories";
import { createTag, updateTag } from "@/lib/actions/tags";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
import { FieldError, FieldLabel, FormActions, FormGrid, FormRow, inputClass } from "@/components/admin/form-fields";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export function TagForm({ tag }: { tag?: Tag }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: tag ? { name: tag.name, slug: tag.slug } : {},
  });

  const { onSlugManualEdit } = useSlugSync(watch("name"), setValue, !!tag);

  function onSubmit(data: TagInput) {
    setServerError(null);
    startTransition(async () => {
      const result = tag ? await updateTag(tag.id, data) : await createTag(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="name" required>Nom</FieldLabel>
          <input id="name" className={inputClass} {...register("name")} />
          <FieldError error={errors.name} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="slug" required>Slug</FieldLabel>
          <input id="slug" className={inputClass} {...register("slug", { onChange: onSlugManualEdit })} />
          <FieldError error={errors.slug} />
        </FormRow>
      </FormGrid>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/tags" />
      </FormActions>
    </form>
  );
}
