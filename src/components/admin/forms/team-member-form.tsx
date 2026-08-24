"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTeamMemberSchema, type CreateTeamMemberInput } from "@/lib/validations/users";
import { createTeamMemberAction } from "@/lib/actions/users";
import {
  FieldError,
  FieldLabel,
  FormActions,
  FormRow,
  inputClass,
  selectClass,
} from "@/components/admin/form-fields";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export function TeamMemberForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeamMemberInput>({
    resolver: zodResolver(createTeamMemberSchema),
    defaultValues: { role: "EDITOR" },
  });

  function onSubmit(data: CreateTeamMemberInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createTeamMemberAction(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormRow>
        <FieldLabel htmlFor="name" required>Nom</FieldLabel>
        <input id="name" className={inputClass} {...register("name")} />
        <FieldError error={errors.name} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="email" required>Email</FieldLabel>
        <input id="email" type="email" className={inputClass} {...register("email")} />
        <FieldError error={errors.email} />
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="password" required>Mot de passe temporaire</FieldLabel>
        <input id="password" type="text" className={inputClass} placeholder="8 caractères min." {...register("password")} />
        <FieldError error={errors.password} />
        <p className="mt-1 text-xs text-muted">
          Transmettez-le vous-même à la personne — elle pourra le changer une fois connectée.
        </p>
      </FormRow>

      <FormRow>
        <FieldLabel htmlFor="role" required>Rôle</FieldLabel>
        <select id="role" className={selectClass} {...register("role")}>
          <option value="EDITOR">Éditeur — gestion du contenu uniquement</option>
          <option value="ADMIN">Admin — accès complet (hors gestion des comptes)</option>
        </select>
      </FormRow>

      {serverError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
      )}

      <FormActions>
        <SubmitButton pending={pending} />
        <CancelLink href="/admin/utilisateurs" />
      </FormActions>
    </form>
  );
}
