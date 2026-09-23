"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { TEMPLATE_METAS, isTemplateId, parseTemplateData } from "@reels/template-meta";
import { exportPathSchema, newReelSchema, saveReelSchema, type NewReelInput, type SaveReelInput } from "@/lib/validations/reels";

/** Crée un projet de Reel avec les valeurs par défaut du template, puis ouvre l'éditeur. */
export async function createReel(input: NewReelInput): Promise<{ error?: string }> {
  await requireSession();
  const parsed = newReelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { title, templateId, format } = parsed.data;
  if (!isTemplateId(templateId)) return { error: "Template inconnu." };
  const meta = TEMPLATE_METAS[templateId];
  if (!meta.formats.includes(format)) return { error: "Ce format n'est pas encore disponible pour ce template." };

  const reel = await prisma.reelProject.create({
    data: { title, templateId, format, data: JSON.stringify(meta.defaultProps(format)) },
  });

  revalidatePath("/admin/reels");
  redirect(`/admin/reels/${reel.id}`);
}

/** Enregistre le titre, les props (validées par le schéma du template) et éventuellement le statut. */
export async function saveReel(id: string, input: SaveReelInput): Promise<{ error?: string; savedAt?: string }> {
  await requireSession();
  const parsed = saveReelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const reel = await prisma.reelProject.findUnique({ where: { id }, select: { templateId: true } });
  if (!reel) return { error: "Projet introuvable." };
  if (!isTemplateId(reel.templateId)) return { error: "Template inconnu." };

  const data = parseTemplateData(reel.templateId, parsed.data.data);
  if (!data.success) {
    const issue = data.error.issues[0];
    return { error: `Données invalides (${issue?.path.join(".") || "?"}) : ${issue?.message ?? ""}` };
  }
  const format = (data.data as { format: string }).format;
  if (!(TEMPLATE_METAS[reel.templateId].formats as string[]).includes(format)) {
    return { error: "Ce format n'est pas encore disponible pour ce template." };
  }

  const updated = await prisma.reelProject.update({
    where: { id },
    data: {
      title: parsed.data.title,
      format,
      data: JSON.stringify(data.data),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
  });

  revalidatePath("/admin/reels");
  return { savedAt: updated.updatedAt.toISOString() };
}

/** Enregistre le résultat d'un export MP4 réussi (chemin relatif au disque externe). */
export async function recordReelExport(id: string, exportPath: string): Promise<{ error?: string }> {
  await requireSession();
  const parsed = exportPathSchema.safeParse(exportPath);
  if (!parsed.success) return { error: "Chemin d'export invalide." };

  await prisma.reelProject.update({
    where: { id },
    data: { status: "EXPORTED", lastExportPath: parsed.data, lastExportAt: new Date() },
  });
  revalidatePath("/admin/reels");
  return {};
}

export async function deleteReel(id: string): Promise<{ error?: string }> {
  await requireSession();
  await prisma.reelProject.delete({ where: { id } });
  revalidatePath("/admin/reels");
  return {};
}
