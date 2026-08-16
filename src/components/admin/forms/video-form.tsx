"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Artist, Category, Video } from "@prisma/client";
import { videoSchema, type VideoInput } from "@/lib/validations/videos";
import { createVideo, updateVideo } from "@/lib/actions/videos";
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
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export function VideoForm({
  video,
  artists,
  categories,
}: {
  video?: Video;
  artists: Artist[];
  categories: Category[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VideoInput>({
    resolver: zodResolver(videoSchema),
    defaultValues: video
      ? {
          title: video.title,
          slug: video.slug,
          description: video.description ?? "",
          youtubeUrl: video.youtubeUrl,
          thumbnailUrl: video.thumbnailUrl ?? "",
          categoryId: video.categoryId ?? "",
          artistId: video.artistId ?? "",
          featured: video.featured,
          published: video.published,
        }
      : { published: true },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!video);

  function onSubmit(data: VideoInput) {
    setServerError(null);
    startTransition(async () => {
      const result = video ? await updateVideo(video.id, data) : await createVideo(data);
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
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <textarea id="description" className={textareaClass} {...register("description")} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="youtubeUrl" required>URL YouTube</FieldLabel>
        <input id="youtubeUrl" className={inputClass} placeholder="https://youtube.com/watch?v=…" {...register("youtubeUrl")} />
        <FieldError error={errors.youtubeUrl} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="thumbnailUrl">Miniature personnalisée (URL)</FieldLabel>
        <ImageUrlField register={register("thumbnailUrl")} defaultValue={video?.thumbnailUrl ?? undefined} />
        <p className="mt-1 text-xs text-muted">Laisser vide pour utiliser la miniature YouTube automatiquement.</p>
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
          <FieldLabel htmlFor="artistId">Artiste</FieldLabel>
          <select id="artistId" className={selectClass} {...register("artistId")}>
            <option value="">Aucun</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </FormRow>
      </FormGrid>

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
        <CancelLink href="/admin/videos" />
      </FormActions>
    </form>
  );
}
