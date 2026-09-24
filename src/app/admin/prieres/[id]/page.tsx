import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { PrayerForm } from "@/components/admin/forms/prayer-form";
import { TransformToReel } from "@/components/admin/reels/transform-to-reel";

export const metadata: Metadata = { title: "Modifier la prière" };

export default async function EditPrayerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const prayer = await prisma.prayer.findUnique({ where: { id } });
  if (!prayer) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Modifier « {prayer.title} »</h1>
        <TransformToReel sourceType="PRAYER" sourceId={id} />
      </div>
      <PrayerForm prayer={prayer} />
    </div>
  );
}
