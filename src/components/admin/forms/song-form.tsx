"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
import type { Artist, Category, Song, Tag } from "@prisma/client";
import { songSchema, type SongInput } from "@/lib/validations/songs";
import { createSong, updateSong } from "@/lib/actions/songs";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
import { generateSongDescriptionAction } from "@/lib/actions/ai";
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
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

type SongWithRelations = Song & { tags: Tag[] };

export function SongForm({
  song,
  artists,
  categories,
  tags,
}: {
  song?: SongWithRelations;
  artists: Artist[];
  categories: Category[];
  tags: Tag[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, startAiTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SongInput>({
    resolver: zodResolver(songSchema),
    defaultValues: song
      ? {
          title: song.title,
          slug: song.slug,
          description: song.description ?? "",
          lyrics: song.lyrics ?? "",
          imageUrl: song.imageUrl,
          audioUrl: song.audioUrl ?? "",
          youtubeUrl: song.youtubeUrl ?? "",
          artistId: song.artistId,
          categoryId: song.categoryId ?? "",
          tagIds: song.tags.map((t) => t.id),
          metaTitle: song.metaTitle ?? "",
          metaDescription: song.metaDescription ?? "",
          featured: song.featured,
          published: song.published,
        }
      : { published: true, tagIds: [] },
  });

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!song);

  const titleValue = watch("title");
  const artistIdValue = watch("artistId");

  function handleGenerateDescription() {
    const artistName = artists.find((a) => a.id === artistIdValue)?.name;
    if (!titleValue || !artistName) {
      setAiError("Renseignez d'abord le titre et l'artiste.");
      return;
    }
    setAiError(null);
    startAiTransition(async () => {
      const result = await generateSongDescriptionAction({ title: titleValue, artistName });
      if ("error" in result) setAiError(result.error);
      else setValue("description", result.data);
    });
  }

  function onSubmit(data: SongInput) {
    setServerError(null);
    startTransition(async () => {
      const result = song ? await updateSong(song.id, data) : await createSong(data);
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
          <FieldLabel htmlFor="artistId" required>Artiste</FieldLabel>
          <select id="artistId" className={selectClass} {...register("artistId")}>
            <option value="">Sélectionner…</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <FieldError error={errors.artistId} />
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
        <div className="mb-1.5 flex items-center justify-between">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={aiPending}
            className="flex items-center gap-1 text-xs font-medium text-gold transition hover:text-gold-soft disabled:opacity-60"
          >
            {aiPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Générer avec l&apos;IA
          </button>
        </div>
        <textarea id="description" className={textareaClass} {...register("description")} />
        {aiError && <p className="mt-1 text-xs text-red-500">{aiError}</p>}
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="lyrics">Paroles (lyrics)</FieldLabel>
        <textarea
          id="lyrics"
          className={textareaClass}
          rows={8}
          placeholder="Couplet 1…&#10;&#10;Refrain…"
          {...register("lyrics")}
        />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="imageUrl" required>Image de couverture (URL)</FieldLabel>
        <ImageUrlField register={register("imageUrl")} defaultValue={song?.imageUrl} />
        <FieldError error={errors.imageUrl} />
      </FormRow>

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="audioUrl">Audio (URL externe)</FieldLabel>
          <input id="audioUrl" className={inputClass} placeholder="https://…" {...register("audioUrl")} />
          <FieldError error={errors.audioUrl} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="youtubeUrl">Vidéo YouTube (URL)</FieldLabel>
          <input id="youtubeUrl" className={inputClass} placeholder="https://youtube.com/…" {...register("youtubeUrl")} />
          <FieldError error={errors.youtubeUrl} />
        </FormRow>
      </FormGrid>

      <FormRow>
        <FieldLabel htmlFor="tags">Tags</FieldLabel>
        <TagPicker
          tags={tags}
          selected={song?.tags.map((t) => t.id) ?? []}
          onChange={(ids) => setValue("tagIds", ids)}
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
        <CancelLink href="/admin/chansons" />
      </FormActions>
    </form>
  );
}
