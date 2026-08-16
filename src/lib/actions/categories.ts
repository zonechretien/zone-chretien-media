"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { categorySchema, type CategoryInput } from "@/lib/validations/categories";

export async function createCategory(input: CategoryInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.category.create({
      data: { ...parsed.data, description: parsed.data.description || null },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, input: CategoryInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.category.update({
      where: { id },
      data: { ...parsed.data, description: parsed.data.description || null },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  // Les contenus liés (songs/articles/videos/inspirations) passent categoryId
  // à NULL automatiquement (ON DELETE SET NULL défini dans le schéma).
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
