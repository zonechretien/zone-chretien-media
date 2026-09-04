"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/session";
import { takedownReportSchema, TAKEDOWN_STATUSES, type TakedownReportInput } from "@/lib/validations/takedown-reports";

export async function submitTakedownReport(input: TakedownReportInput): Promise<{ error?: string; success?: boolean }> {
  const parsed = takedownReportSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide. Vérifiez les champs et réessayez." };

  await prisma.takedownReport.create({
    data: {
      requesterName: parsed.data.requesterName,
      requesterEmail: parsed.data.requesterEmail,
      message: parsed.data.message,
      contentType: parsed.data.contentType || null,
      contentId: parsed.data.contentId || null,
      contentTitle: parsed.data.contentTitle || null,
      contentUrl: parsed.data.contentUrl || null,
    },
  });

  return { success: true };
}

export async function updateTakedownReportStatus(
  id: string,
  status: (typeof TAKEDOWN_STATUSES)[number],
): Promise<{ error?: string } | void> {
  await requireAdminRole();
  if (!TAKEDOWN_STATUSES.includes(status)) return { error: "Statut invalide." };

  await prisma.takedownReport.update({ where: { id }, data: { status } });
  revalidatePath("/admin/signalements");
  revalidatePath(`/admin/signalements/${id}`);
}

export async function deleteTakedownReport(id: string): Promise<{ error?: string } | void> {
  await requireAdminRole();
  await prisma.takedownReport.delete({ where: { id } });
  revalidatePath("/admin/signalements");
}
