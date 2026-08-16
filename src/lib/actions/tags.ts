"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { tagSchema, type TagInput } from "@/lib/validations/categories";

export async function createTag(input: TagInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.tag.create({ data: parsed.data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function updateTag(id: string, input: TagInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.tag.update({ where: { id }, data: parsed.data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteTag(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
}
