"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { inspirationSchema, type InspirationInput } from "@/lib/validations/inspirations";

function toData(input: InspirationInput) {
  return {
    title: input.title,
    slug: input.slug,
    content: input.content,
    imageUrl: input.imageUrl || null,
    author: input.author || null,
    categoryId: input.categoryId || null,
    published: input.published ?? true,
  };
}

export async function createInspiration(input: InspirationInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = inspirationSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.inspiration.create({ data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/inspirations");
  revalidatePath("/inspirations");
  revalidatePath("/");
  redirect("/admin/inspirations");
}

export async function updateInspiration(id: string, input: InspirationInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = inspirationSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.inspiration.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/inspirations");
  revalidatePath("/inspirations");
  revalidatePath("/");
  redirect("/admin/inspirations");
}

export async function deleteInspiration(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.inspiration.delete({ where: { id } });
  revalidatePath("/admin/inspirations");
  revalidatePath("/inspirations");
}
