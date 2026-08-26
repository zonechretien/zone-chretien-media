"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Article, Category, Tag } from "@prisma/client";
import { articleSchema, type ArticleInput } from "@/lib/validations/articles";
import { createArticle, updateArticle } from "@/lib/actions/articles";
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
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { PublishedAtField } from "@/components/admin/published-at-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";
import { dateToUrlSlug } from "@/lib/utils";

type ArticleWithTags = Article & { tags: Tag[] };

export function ArticleForm({
  article,
  categories,
  tags,
}: {
  article?: ArticleWithTags;
  categories: Category[];
  tags: Tag[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleSchema),
    defaultValues: article
      ? {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? "",
          content: article.content,
          coverImageUrl: article.coverImageUrl ?? "",
          categoryId: article.categoryId ?? "",
          tagIds: article.tags.map((t) => t.id),
          metaTitle: article.metaTitle ?? "",
          metaDescription: article.metaDescription ?? "",
          publishedAt: dateToUrlSlug(article.publishedAt ?? article.createdAt),
          featured: article.featured,
          published: article.published,
        }
      : { published: true, content: "", tagIds: [], publishedAt: dateToUrlSlug(new Date()) },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!article);

  function onSubmit(data: ArticleInput) {
    setServerError(null);
    startTransition(async () => {
      const result = article ? await updateArticle(article.id, data) : await createArticle(data);
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
        <FieldLabel htmlFor="excerpt">Extrait</FieldLabel>
        <textarea id="excerpt" className={textareaClass} rows={2} {...register("excerpt")} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="content" required>Contenu</FieldLabel>
        <Controller
          control={control}
          name="content"
          render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />}
        />
        <FieldError error={errors.content} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="coverImageUrl">Image de couverture (URL)</FieldLabel>
        <ImageUrlField register={register("coverImageUrl")} defaultValue={article?.coverImageUrl ?? undefined} />
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
          <TagPicker tags={tags} selected={article?.tags.map((t) => t.id) ?? []} onChange={(ids) => setValue("tagIds", ids)} />
        </FormRow>
      </FormGrid>

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="metaTitle">Meta title (SEO)</FieldLabel>
          <input id="metaTitle" className={inputClass} {...register("metaTitle")} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="metaDescription">Meta description (SEO)</FieldLabel>
          <input id="metaDescription" className={inputClass} {...register("metaDescription")} />
        </FormRow>
      </FormGrid>

      <FormRow>
        <PublishedAtField register={register("publishedAt")} />
      </FormRow>

      <FormRow className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className={checkboxClass} {...register("featured")} /> Mettre en vedette
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className={checkboxClass} defaultChecked {...register("published")} /> Publié
        </label>
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/articles" />
      </FormActions>
    </form>
  );
}
