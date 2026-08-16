"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Banner } from "@prisma/client";
import {
  bannerSchema,
  type BannerInput,
  BANNER_TYPES,
  BANNER_TYPE_LABELS,
} from "@/lib/validations/banners";
import { createBanner, updateBanner } from "@/lib/actions/banners";
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
import { dateToUrlSlug } from "@/lib/utils";

export function BannerForm({ banner }: { banner?: Banner }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues: banner
      ? {
          type: banner.type,
          title: banner.title,
          imageUrl: banner.imageUrl ?? "",
          linkUrl: banner.linkUrl ?? "",
          adsenseSlotCode: banner.adsenseSlotCode ?? "",
          position: banner.position ?? "",
          active: banner.active,
          startDate: banner.startDate ? dateToUrlSlug(banner.startDate) : "",
          endDate: banner.endDate ? dateToUrlSlug(banner.endDate) : "",
        }
      : { type: "ADSENSE", active: true },
  });

  const type = watch("type");

  function onSubmit(data: BannerInput) {
    setServerError(null);
    startTransition(async () => {
      const result = banner ? await updateBanner(banner.id, data) : await createBanner(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="type" required>Type</FieldLabel>
          <select id="type" className={selectClass} {...register("type")}>
            {BANNER_TYPES.map((t) => (
              <option key={t} value={t}>{BANNER_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <FieldError error={errors.type} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="title" required>Titre (interne)</FieldLabel>
          <input id="title" className={inputClass} {...register("title")} />
          <FieldError error={errors.title} />
        </FormRow>
      </FormGrid>

      {type === "ADSENSE" ? (
        <FormRow>
          <FieldLabel htmlFor="adsenseSlotCode">Code AdSense</FieldLabel>
          <textarea
            id="adsenseSlotCode"
            className={`${textareaClass} font-mono text-xs`}
            placeholder="<ins class=&quot;adsbygoogle&quot; …></ins>"
            {...register("adsenseSlotCode")}
          />
        </FormRow>
      ) : (
        <>
          <FormRow>
            <FieldLabel htmlFor="imageUrl">Image (URL)</FieldLabel>
            <ImageUrlField register={register("imageUrl")} defaultValue={banner?.imageUrl ?? undefined} />
            <FieldError error={errors.imageUrl} />
          </FormRow>
          <FormRow>
            <FieldLabel htmlFor="linkUrl">Lien de destination</FieldLabel>
            <input id="linkUrl" className={inputClass} placeholder="https://…" {...register("linkUrl")} />
            <FieldError error={errors.linkUrl} />
          </FormRow>
        </>
      )}

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="position">Emplacement</FieldLabel>
          <select id="position" className={selectClass} {...register("position")}>
            <option value="">Non spécifié</option>
            <option value="header">En-tête</option>
            <option value="sidebar">Barre latérale</option>
            <option value="in-content">Dans le contenu</option>
            <option value="footer">Pied de page</option>
          </select>
        </FormRow>
        <FormRow>
          <label className="mt-7 flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className={checkboxClass} defaultChecked {...register("active")} /> Actif
          </label>
        </FormRow>
      </FormGrid>

      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="startDate">Date de début</FieldLabel>
          <input id="startDate" type="date" className={inputClass} {...register("startDate")} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="endDate">Date de fin</FieldLabel>
          <input id="endDate" type="date" className={inputClass} {...register("endDate")} />
        </FormRow>
      </FormGrid>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/banners" />
      </FormActions>
    </form>
  );
}
