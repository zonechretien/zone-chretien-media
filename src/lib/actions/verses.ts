"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueConstraintError } from "@/lib/prisma-errors";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { verseSchema, type VerseInput } from "@/lib/validations/verses";

function toData(input: VerseInput) {
  const hasMeditation = !!(
    input.meditationReflection ||
    input.meditationApplication ||
    input.meditationPrayer
  );

  return {
    reference: input.reference,
    text: input.text,
    explanation: input.explanation || null,
    imageUrl: input.imageUrl || null,
    date: new Date(`${input.date}T00:00:00.000Z`),
    published: input.published ?? true,
    meditationReflection: input.meditationReflection || null,
    meditationApplication: input.meditationApplication || null,
    meditationPrayer: input.meditationPrayer || null,
    // Le client suit IA_GENERE/IA_MODIFIE ; si du texte est saisi sans passer
    // par la génération IA (source absente), on retombe sur MANUEL. Si tous
    // les champs sont vides, aucune source n'est enregistrée.
    meditationSource: !hasMeditation ? null : (input.meditationSource ?? "MANUEL"),
  };
}

export async function createVerse(input: VerseInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = verseSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.verse.create({ data: toData(parsed.data) });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Un verset existe déjà pour cette date." };
    }
    throw err;
  }

  revalidatePath("/admin/versets");
  revalidatePath("/versets");
  revalidatePath("/");
  redirect("/admin/versets");
}

export async function updateVerse(id: string, input: VerseInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = verseSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  try {
    await prisma.verse.update({ where: { id }, data: toData(parsed.data) });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "Un verset existe déjà pour cette date." };
    }
    throw err;
  }

  revalidatePath("/admin/versets");
  revalidatePath("/versets");
  revalidatePath("/");
  redirect("/admin/versets");
}

export async function deleteVerse(id: string): Promise<{ error?: string } | void> {
  await requireSession();
  await prisma.verse.delete({ where: { id } });
  revalidatePath("/admin/versets");
  revalidatePath("/versets");
}
