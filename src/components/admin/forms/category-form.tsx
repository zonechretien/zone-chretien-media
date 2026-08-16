"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category } from "@prisma/client";
import {
  categorySchema,
  type CategoryInput,
  CATEGORY_TYPES,
  CATEGORY_TYPE_LABELS,
} from "@/lib/validations/categories";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
import {
  FieldError,
  FieldLabel,
  FormActions,
  FormGrid,
  FormRow,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export function CategoryForm({ category }: { category?: Category }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          type: category.type as CategoryInput["type"],
          description: category.description ?? "",
        }
      : { type: "SONG" },
  });

  const { onSlugManualEdit } = useSlugSync(watch("name"), setValue, !!category);

  function onSubmit(data: CategoryInput) {
    setServerError(null);
    startTransition(async () => {
      const result = category ? await updateCategory(category.id, data) : await createCategory(data);
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

      <FormRow>
        <FieldLabel htmlFor="type" required>S&apos;applique à</FieldLabel>
        <select id="type" className={selectClass} {...register("type")}>
          {CATEGORY_TYPES.map((t) => (
            <option key={t} value={t}>{CATEGORY_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <FieldError error={errors.type} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <textarea id="description" className={textareaClass} rows={3} {...register("description")} />
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/categories" />
      </FormActions>
    </form>
  );
}
