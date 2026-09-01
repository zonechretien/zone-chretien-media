"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category, Resource, Tag } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import {
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_FILE_FIELD_CONFIG,
  resourceSchema,
  type ResourceInput,
} from "@/lib/validations/resources";
import { createResource, updateResource } from "@/lib/actions/resources";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
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
import { TagPicker } from "@/components/admin/tag-picker";
import { YoutubeEmbedCheck } from "@/components/admin/youtube-embed-check";
import { PublishedAtField } from "@/components/admin/published-at-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";
import { dateToUrlSlug } from "@/lib/utils";

type ResourceWithTags = Resource & { tags: Tag[] };

export function ResourceForm({
  resource,
  categories,
  tags,
}: {
  resource?: ResourceWithTags;
  categories: Category[];
  tags: Tag[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResourceInput>({
    resolver: zodResolver(resourceSchema),
    defaultValues: resource
      ? {
          title: resource.title,
          slug: resource.slug,
          description: resource.description ?? "",
          author: resource.author ?? "",
          type: resource.type,
          fileUrl: resource.fileUrl,
          coverImageUrl: resource.coverImageUrl ?? "",
          categoryId: resource.categoryId ?? "",
          tagIds: resource.tags.map((t) => t.id),
          publishedAt: dateToUrlSlug(resource.publishedAt ?? resource.createdAt),
          published: resource.published,
        }
      : { type: "BOOK", published: true, tagIds: [], publishedAt: dateToUrlSlug(new Date()) },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!resource);
  const typeValue = watch("type");
  const fileUrlValue = watch("fileUrl");
  const fileFieldConfig = RESOURCE_FILE_FIELD_CONFIG[typeValue] ?? RESOURCE_FILE_FIELD_CONFIG.BOOK;

  function onSubmit(data: ResourceInput) {
    setServerError(null);
    startTransition(async () => {
      const result = resource ? await updateResource(resource.id, data) : await createResource(data);
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

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="type" required>Type de ressource</FieldLabel>
          <select id="type" className={selectClass} {...register("type")}>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <FieldError error={errors.type} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="author">Auteur</FieldLabel>
          <input id="author" className={inputClass} {...register("author")} />
        </FormRow>
      </FormGrid>

      <FormRow>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <textarea id="description" className={textareaClass} rows={5} {...register("description")} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="fileUrl" required>{fileFieldConfig.label}</FieldLabel>
        <input
          id="fileUrl"
          className={inputClass}
          placeholder={fileFieldConfig.placeholder}
          {...register("fileUrl")}
        />
        <FieldError error={errors.fileUrl} />
        <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-navy/5 px-3 py-2 text-xs text-muted dark:bg-white/5">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          Le site n&apos;héberge aucun fichier lourd (PDF, audio) directement — utilisez un lien
          externe gratuit (GitHub Releases, Google Drive en partage public, etc.). Pour une
          prédication vidéo, utilisez un lien YouTube.
        </p>
        <YoutubeEmbedCheck url={fileUrlValue ?? ""} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="coverImageUrl">Image de couverture (URL)</FieldLabel>
        <ImageUrlField register={register("coverImageUrl")} defaultValue={resource?.coverImageUrl ?? undefined} />
      </FormRow>

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="categoryId">Catégorie</FieldLabel>
          <select id="categoryId" className={selectClass} {...register("categoryId")}>
            <option value="">Aucune</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="tags">Tags</FieldLabel>
          <TagPicker tags={tags} selected={resource?.tags.map((t) => t.id) ?? []} onChange={(ids) => setValue("tagIds", ids)} />
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
        <CancelLink href="/admin/bibliotheque" />
      </FormActions>
    </form>
  );
}
