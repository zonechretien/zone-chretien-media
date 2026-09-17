"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { slugify } from "@/lib/utils";
import { readingPlanSchema, type ReadingPlanInput } from "@/lib/validations/reading-plans";

function toData(input: ReadingPlanInput) {
  return {
    title: input.title,
    slug: slugify(input.slug),
    description: input.description || null,
    durationDays: input.durationDays,
    coverImageUrl: input.coverImageUrl || null,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    published: input.published ?? false,
    publishedAt: input.published ? new Date() : null,
  };
}

function toDaysCreate(days: ReadingPlanInput["days"]) {
  return days.map((day) => ({
    dayNumber: day.dayNumber,
    passages: {
      create: day.passages.map((passage, position) => ({
        bookSlug: passage.bookSlug,
        bookName: passage.bookName,
        chapterStart: passage.chapterStart,
        chapterEnd: passage.chapterEnd,
        position,
      })),
    },
  }));
}

export async function createReadingPlanAction(input: ReadingPlanInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = readingPlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  try {
    await prisma.readingPlan.create({
      data: {
        ...toData(parsed.data),
        days: { create: toDaysCreate(parsed.data.days) },
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Ce slug est déjà utilisé par un autre plan de lecture." };
    }
    throw err;
  }

  revalidatePath("/admin/plans-lecture");
  revalidatePath("/bible/plans");
  revalidatePath("/bible");
  redirect("/admin/plans-lecture");
}

export async function updateReadingPlanAction(
  id: string,
  input: ReadingPlanInput,
): Promise<{ error?: string }> {
  await requireSession();
  const existing = await prisma.readingPlan.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return { error: "Plan de lecture introuvable." };

  const parsed = readingPlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  try {
    await prisma.$transaction([
      // La cascade Prisma (ReadingPlanDay -> ReadingPlanPassage) supprime
      // aussi les passages : pas besoin de deleteMany au niveau passage.
      prisma.readingPlanDay.deleteMany({ where: { planId: id } }),
      prisma.readingPlan.update({
        where: { id },
        data: { ...toData(parsed.data), days: { create: toDaysCreate(parsed.data.days) } },
      }),
    ]);
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Ce slug est déjà utilisé par un autre plan de lecture." };
    }
    throw err;
  }

  revalidatePath("/admin/plans-lecture");
  revalidatePath("/bible/plans");
  revalidatePath(`/bible/plans/${existing.slug}`);
  revalidatePath(`/bible/plans/${parsed.data.slug}`);
  revalidatePath("/bible");
  redirect("/admin/plans-lecture");
}

export async function deleteReadingPlanAction(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.readingPlan.delete({ where: { id } });
  revalidatePath("/admin/plans-lecture");
  revalidatePath("/bible/plans");
  revalidatePath("/bible");
}
