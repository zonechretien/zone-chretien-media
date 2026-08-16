"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/session";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";

export async function updateSettings(input: SettingsInput): Promise<{ error?: string; success?: boolean }> {
  await requireAdminRole();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  const data = {
    siteName: parsed.data.siteName,
    siteDescription: parsed.data.siteDescription,
    logoUrl: parsed.data.logoUrl || null,
    faviconUrl: parsed.data.faviconUrl || null,
    primaryColor: parsed.data.primaryColor,
    accentColor: parsed.data.accentColor,
    facebookUrl: parsed.data.facebookUrl || null,
    youtubeUrl: parsed.data.youtubeUrl || null,
    instagramUrl: parsed.data.instagramUrl || null,
    tiktokUrl: parsed.data.tiktokUrl || null,
    whatsappNumber: parsed.data.whatsappNumber || null,
    contactEmail: parsed.data.contactEmail || null,
    adsenseClientId: parsed.data.adsenseClientId || null,
    aiProvider: parsed.data.aiProvider,
    maintenanceMode: parsed.data.maintenanceMode ?? false,
  };

  await prisma.settings.upsert({
    where: { id: "settings" },
    update: data,
    create: { id: "settings", ...data },
  });

  revalidatePath("/admin/parametres");
  revalidatePath("/", "layout");
  return { success: true };
}
