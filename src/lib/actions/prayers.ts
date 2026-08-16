"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { prayerSchema, type PrayerInput } from "@/lib/validations/prayers";

function toData(input: PrayerInput) {
  return {
    title: input.title,
    slug: input.slug,
    content: input.content,
    category: input.category,
    imageUrl: input.imageUrl || null,
    published: input.published ?? true,
  };
}

export async function createPrayer(input: PrayerInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = prayerSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.prayer.create({ data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/prieres");
  revalidatePath("/prieres");
  redirect("/admin/prieres");
}

export async function updatePrayer(id: string, input: PrayerInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = prayerSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.prayer.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ce slug est déjà utilisé." };
    }
    throw err;
  }

  revalidatePath("/admin/prieres");
  revalidatePath("/prieres");
  redirect("/admin/prieres");
}

export async function deletePrayer(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.prayer.delete({ where: { id } });
  revalidatePath("/admin/prieres");
  revalidatePath("/prieres");
}
