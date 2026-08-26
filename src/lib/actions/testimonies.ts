"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { slugify, parseDateInput } from "@/lib/utils";
import { testimonySchema, type TestimonyInput } from "@/lib/validations/testimonies";

function toData(input: TestimonyInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    content: input.content,
    authorName: input.authorName,
    imageUrl: input.imageUrl || null,
    publishedAt: input.publishedAt ? parseDateInput(input.publishedAt) : null,
    published: input.published ?? true,
  };
}

export async function createTestimony(input: TestimonyInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = testimonySchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.testimony.create({ data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/temoignages");
  revalidatePath("/temoignages");
  revalidatePath("/");
  redirect("/admin/temoignages");
}

export async function updateTestimony(id: string, input: TestimonyInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = testimonySchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.testimony.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/temoignages");
  revalidatePath("/temoignages");
  revalidatePath("/");
  redirect("/admin/temoignages");
}

export async function deleteTestimony(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.testimony.delete({ where: { id } });
  revalidatePath("/admin/temoignages");
  revalidatePath("/temoignages");
}
