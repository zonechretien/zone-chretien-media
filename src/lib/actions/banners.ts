"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/session";
import { bannerSchema, type BannerInput } from "@/lib/validations/banners";

function toData(input: BannerInput) {
  return {
    type: input.type,
    title: input.title,
    imageUrl: input.imageUrl || null,
    linkUrl: input.linkUrl || null,
    adsenseSlotCode: input.adsenseSlotCode || null,
    position: input.position || null,
    active: input.active ?? true,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
  };
}

export async function createBanner(input: BannerInput): Promise<{ error?: string }> {
  await requireAdminRole();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  await prisma.banner.create({ data: toData(parsed.data) });
  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}

export async function updateBanner(id: string, input: BannerInput): Promise<{ error?: string }> {
  await requireAdminRole();
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { error: "Formulaire invalide." };

  await prisma.banner.update({ where: { id }, data: toData(parsed.data) });
  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}

export async function deleteBanner(id: string): Promise<{ error?: string } | void> {
  await requireAdminRole();
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
}
