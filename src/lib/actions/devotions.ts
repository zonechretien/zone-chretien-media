"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { slugify, parseDateInput } from "@/lib/utils";
import { devotionSchema, type DevotionInput } from "@/lib/validations/devotions";

function toData(input: DevotionInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    mainVerseRef: input.mainVerseRef,
    mainVerseText: input.mainVerseText,
    reflection: input.reflection,
    application: input.application,
    prayer: input.prayer,
    imageUrl: input.imageUrl || null,
    date: parseDateInput(input.date),
    published: input.published ?? true,
  };
}

export async function createDevotion(input: DevotionInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = devotionSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.devotion.create({ data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/devotions");
  revalidatePath("/devotions");
  revalidatePath("/");
  redirect("/admin/devotions");
}

export async function updateDevotion(id: string, input: DevotionInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = devotionSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.devotion.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/devotions");
  revalidatePath("/devotions");
  revalidatePath("/");
  redirect("/admin/devotions");
}

export async function deleteDevotion(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.devotion.delete({ where: { id } });
  revalidatePath("/admin/devotions");
  revalidatePath("/devotions");
}
