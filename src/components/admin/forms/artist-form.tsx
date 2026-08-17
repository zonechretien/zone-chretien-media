"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Artist } from "@prisma/client";
import { artistSchema, type ArtistInput } from "@/lib/validations/artists";
import { createArtist, updateArtist } from "@/lib/actions/artists";
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
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export function ArtistForm({ artist }: { artist?: Artist }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ArtistInput>({
    resolver: zodResolver(artistSchema),
    defaultValues: artist
      ? {
          name: artist.name,
          slug: artist.slug,
          role: artist.role ?? "",
          bio: artist.bio ?? "",
          photoUrl: artist.photoUrl ?? "",
          facebookUrl: artist.facebookUrl ?? "",
          instagramUrl: artist.instagramUrl ?? "",
          youtubeUrl: artist.youtubeUrl ?? "",
          tiktokUrl: artist.tiktokUrl ?? "",
          twitterUrl: artist.twitterUrl ?? "",
          isSponsored: artist.isSponsored,
        }
      : {},
  });

  const { onSlugManualEdit } = useSlugSync(watch("name"), setValue, !!artist);

  function onSubmit(data: ArtistInput) {
    setServerError(null);
    startTransition(async () => {
      const result = artist ? await updateArtist(artist.id, data) : await createArtist(data);
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
        <FieldLabel htmlFor="role">Rôle / titre court</FieldLabel>
        <input
          id="role"
          className={inputClass}
          placeholder="Ex. Artiste gospel, Évangéliste & Chanteur"
          {...register("role")}
        />
        <FieldError error={errors.role} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="bio">Biographie</FieldLabel>
        <textarea id="bio" className={textareaClass} {...register("bio")} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="photoUrl">Photo (URL)</FieldLabel>
        <ImageUrlField register={register("photoUrl")} defaultValue={artist?.photoUrl ?? undefined} />
        <FieldError error={errors.photoUrl} />
      </FormRow>

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="facebookUrl">Facebook</FieldLabel>
          <input id="facebookUrl" className={inputClass} {...register("facebookUrl")} />
          <FieldError error={errors.facebookUrl} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="instagramUrl">Instagram</FieldLabel>
          <input id="instagramUrl" className={inputClass} {...register("instagramUrl")} />
          <FieldError error={errors.instagramUrl} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="youtubeUrl">YouTube</FieldLabel>
          <input id="youtubeUrl" className={inputClass} {...register("youtubeUrl")} />
          <FieldError error={errors.youtubeUrl} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="twitterUrl">X (Twitter)</FieldLabel>
          <input id="twitterUrl" className={inputClass} {...register("twitterUrl")} />
          <FieldError error={errors.twitterUrl} />
        </FormRow>
      </FormGrid>

      <FormRow>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className={checkboxClass} {...register("isSponsored")} /> Artiste sponsorisé
        </label>
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/artistes" />
      </FormActions>
    </form>
  );
}
