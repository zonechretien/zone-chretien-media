"use server";

import { changeOwnPassword } from "@/lib/admin/profile-service";
import { ForbiddenError } from "@/lib/admin/permissions";
import type { ChangePasswordInput } from "@/lib/validations/profile";

function toActionError(err: unknown): { error: string } {
  if (err instanceof ForbiddenError) return { error: err.message };
  if (err instanceof Error) return { error: err.message };
  return { error: "Une erreur inattendue est survenue." };
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await changeOwnPassword(input);
  } catch (err) {
    return toActionError(err);
  }
  return { success: true };
}
