import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { PrayerForm } from "@/components/admin/forms/prayer-form";

export const metadata: Metadata = { title: "Modifier la prière" };

export default async function EditPrayerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const prayer = await prisma.prayer.findUnique({ where: { id } });
  if (!prayer) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {prayer.title} »</h1>
      <PrayerForm prayer={prayer} />
    </div>
  );
}
