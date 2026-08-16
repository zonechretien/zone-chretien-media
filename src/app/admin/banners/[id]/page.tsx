import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { BannerForm } from "@/components/admin/forms/banner-form";

export const metadata: Metadata = { title: "Modifier la bannière" };

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole();
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {banner.title} »</h1>
      <BannerForm banner={banner} />
    </div>
  );
}
