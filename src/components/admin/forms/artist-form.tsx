"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Artist, Tag } from "@prisma/client";
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
import { TagPicker } from "@/components/admin/tag-picker";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

type ArtistWithTags = Artist & { tags: Tag[] };

export function ArtistForm({ artist, tags }: { artist?: ArtistWithTags; tags: Tag[] }) {
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
          whatsappNumber: artist.whatsappNumber ?? "",
          email: artist.email ?? "",
          isSponsored: artist.isSponsored,
          tagIds: artist.tags.map((t) => t.id),
        }
      : { tagIds: [] },
  });

  const { onSlugManualEdit } = useSlugSync(watch("name"), setValue, !!artist);
  const tagIdsValue = watch("tagIds") ?? [];

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

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="whatsappNumber">Numéro WhatsApp</FieldLabel>
          <input
            id="whatsappNumber"
            className={inputClass}
            placeholder="+509XXXXXXXX"
            {...register("whatsappNumber")}
          />
          <FieldError error={errors.whatsappNumber} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="email">Email de contact</FieldLabel>
          <input
            id="email"
            type="email"
            className={inputClass}
            placeholder="artiste@exemple.com"
            {...register("email")}
          />
          <FieldError error={errors.email} />
        </FormRow>
      </FormGrid>

      <FormRow>
        <FieldLabel htmlFor="tags">Tags</FieldLabel>
        <TagPicker
          tags={tags}
          selected={tagIdsValue}
          onChange={(ids) => setValue("tagIds", ids)}
        />
      </FormRow>

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
