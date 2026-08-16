"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import type { Settings } from "@prisma/client";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { updateSettings } from "@/lib/actions/settings";
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
import { SubmitButton } from "@/components/admin/submit-button";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl ?? "",
      faviconUrl: settings.faviconUrl ?? "",
      primaryColor: settings.primaryColor,
      accentColor: settings.accentColor,
      facebookUrl: settings.facebookUrl ?? "",
      youtubeUrl: settings.youtubeUrl ?? "",
      instagramUrl: settings.instagramUrl ?? "",
      tiktokUrl: settings.tiktokUrl ?? "",
      whatsappNumber: settings.whatsappNumber ?? "",
      contactEmail: settings.contactEmail ?? "",
      adsenseClientId: settings.adsenseClientId ?? "",
      aiProvider: settings.aiProvider,
      maintenanceMode: settings.maintenanceMode,
    },
  });

  function onSubmit(data: SettingsInput) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateSettings(data);
      if (result?.error) setServerError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Identité du site</h2>
      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="siteName" required>Nom du site</FieldLabel>
          <input id="siteName" className={inputClass} {...register("siteName")} />
          <FieldError error={errors.siteName} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="contactEmail">Email de contact</FieldLabel>
          <input id="contactEmail" className={inputClass} {...register("contactEmail")} />
          <FieldError error={errors.contactEmail} />
        </FormRow>
      </FormGrid>
      <FormRow>
        <FieldLabel htmlFor="siteDescription" required>Slogan / description</FieldLabel>
        <textarea id="siteDescription" className={textareaClass} rows={2} {...register("siteDescription")} />
        <FieldError error={errors.siteDescription} />
      </FormRow>
      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="logoUrl">Logo (URL)</FieldLabel>
          <ImageUrlField register={register("logoUrl")} defaultValue={settings.logoUrl ?? undefined} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="faviconUrl">Favicon (URL)</FieldLabel>
          <ImageUrlField register={register("faviconUrl")} defaultValue={settings.faviconUrl ?? undefined} />
        </FormRow>
      </FormGrid>
      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="primaryColor" required>Couleur principale</FieldLabel>
          <input id="primaryColor" type="text" className={inputClass} {...register("primaryColor")} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="accentColor" required>Couleur d&apos;accent (or)</FieldLabel>
          <input id="accentColor" type="text" className={inputClass} {...register("accentColor")} />
        </FormRow>
      </FormGrid>

      <h2 className="mb-4 mt-8 text-lg font-semibold text-foreground">Réseaux sociaux</h2>
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
          <FieldLabel htmlFor="tiktokUrl">TikTok</FieldLabel>
          <input id="tiktokUrl" className={inputClass} {...register("tiktokUrl")} />
          <FieldError error={errors.tiktokUrl} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="whatsappNumber">Numéro WhatsApp</FieldLabel>
          <input id="whatsappNumber" className={inputClass} placeholder="+243…" {...register("whatsappNumber")} />
        </FormRow>
      </FormGrid>

      <h2 className="mb-4 mt-8 text-lg font-semibold text-foreground">Monétisation & IA</h2>
      <FormGrid>
        <FormRow>
          <FieldLabel htmlFor="adsenseClientId">ID client Google AdSense</FieldLabel>
          <input id="adsenseClientId" className={inputClass} placeholder="ca-pub-…" {...register("adsenseClientId")} />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="aiProvider" required>Fournisseur IA par défaut</FieldLabel>
          <select id="aiProvider" className={selectClass} {...register("aiProvider")}>
            <option value="GEMINI">Gemini (production)</option>
            <option value="OLLAMA">Ollama (développement local)</option>
          </select>
        </FormRow>
      </FormGrid>

      <FormRow>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className={checkboxClass} {...register("maintenanceMode")} /> Mode maintenance
        </label>
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}
      {success && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600">
          <CheckCircle2 size={16} /> Paramètres enregistrés.
        </p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
      </FormActions>
    </form>
  );
}
