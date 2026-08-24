"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { createTeamMember, setTeamMemberActive, setTeamMemberRole } from "@/lib/admin/users-service";
import { ForbiddenError } from "@/lib/admin/permissions";
import type { CreateTeamMemberInput } from "@/lib/validations/users";
import { redirect } from "next/navigation";

function toActionError(err: unknown): { error: string } {
  if (err instanceof ForbiddenError) return { error: err.message };
  if (err instanceof Error) return { error: err.message };
  return { error: "Une erreur inattendue est survenue." };
}

export async function createTeamMemberAction(input: CreateTeamMemberInput): Promise<{ error?: string }> {
  try {
    await createTeamMember(input);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

export async function setTeamMemberActiveAction(id: string, active: boolean): Promise<{ error?: string }> {
  try {
    await setTeamMemberActive(id, active);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/utilisateurs");
  return {};
}

export async function setTeamMemberRoleAction(id: string, role: Role): Promise<{ error?: string }> {
  try {
    await setTeamMemberRole(id, role);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/utilisateurs");
  return {};
}
