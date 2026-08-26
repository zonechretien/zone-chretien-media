"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Playlist } from "@prisma/client";
import { playlistSchema, type PlaylistInput } from "@/lib/validations/playlists";
import { createPlaylist, updatePlaylist } from "@/lib/actions/playlists";
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
import { SongPicker, type PickableSong } from "@/components/admin/song-picker";
import { PublishedAtField } from "@/components/admin/published-at-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";
import { dateToUrlSlug } from "@/lib/utils";

export function PlaylistForm({
  playlist,
  songIds: initialSongIds,
  songs,
}: {
  playlist?: Playlist;
  songIds?: string[];
  songs: PickableSong[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlaylistInput>({
    resolver: zodResolver(playlistSchema),
    defaultValues: playlist
      ? {
          title: playlist.title,
          slug: playlist.slug,
          description: playlist.description ?? "",
          imageUrl: playlist.imageUrl ?? "",
          order: playlist.order,
          metaTitle: playlist.metaTitle ?? "",
          metaDescription: playlist.metaDescription ?? "",
          publishedAt: dateToUrlSlug(playlist.publishedAt ?? playlist.createdAt),
          published: playlist.published,
          songIds: initialSongIds ?? [],
        }
      : { published: false, order: 0, songIds: [], publishedAt: dateToUrlSlug(new Date()) },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!playlist);
  const songIdsValue = watch("songIds") ?? [];

  function onSubmit(data: PlaylistInput) {
    setServerError(null);
    startTransition(async () => {
      const result = playlist ? await updatePlaylist(playlist.id, data) : await createPlaylist(data);
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
        <textarea
          id="description"
          className={textareaClass}
          placeholder="Courte description affichée sur la page de la playlist…"
          {...register("description")}
        />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="imageUrl">Image de couverture (URL)</FieldLabel>
        <ImageUrlField register={register("imageUrl")} defaultValue={playlist?.imageUrl ?? undefined} />
        <FieldError error={errors.imageUrl} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="order">Ordre d&apos;affichage</FieldLabel>
        <input
          id="order"
          type="number"
          className={`${inputClass} max-w-[160px]`}
          {...register("order", { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-muted">Les playlists sont listées par ordre croissant (0 en premier).</p>
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="songs">Chansons</FieldLabel>
        <SongPicker
          songs={songs}
          selected={songIdsValue}
          onChange={(ids) => setValue("songIds", ids)}
        />
      </FormRow>

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

      <FormRow>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className={checkboxClass} {...register("published")} /> Publiée
        </label>
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/playlists" />
      </FormActions>
    </form>
  );
}
