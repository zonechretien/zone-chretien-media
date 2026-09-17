"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/profile";
import { changePasswordAction } from "@/lib/actions/profile";
import { FieldError, FieldLabel, FormActions, FormRow, inputClass } from "@/components/admin/form-fields";
import { SubmitButton } from "@/components/admin/submit-button";

export function ChangePasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  function onSubmit(data: ChangePasswordInput) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changePasswordAction(data);
      if (result?.error) {
        setServerError(result.error);
      } else {
        setSuccess(true);
        reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormRow>
        <FieldLabel htmlFor="currentPassword" required>Mot de passe actuel</FieldLabel>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          {...register("currentPassword")}
        />
        <FieldError error={errors.currentPassword} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="newPassword" required>Nouveau mot de passe</FieldLabel>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="8 caractères min."
          className={inputClass}
          {...register("newPassword")}
        />
        <FieldError error={errors.newPassword} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="confirmPassword" required>Confirmer le nouveau mot de passe</FieldLabel>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register("confirmPassword")}
        />
        <FieldError error={errors.confirmPassword} />
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600">
          Mot de passe mis à jour avec succès.
        </p>
      )}

      <FormActions>
        <SubmitButton pending={pending} label="Changer le mot de passe" />
      </FormActions>
    </form>
  );
}
