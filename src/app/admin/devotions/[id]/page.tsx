import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { DevotionForm } from "@/components/admin/forms/devotion-form";
import { TransformToReel } from "@/components/admin/reels/transform-to-reel";

export const metadata: Metadata = { title: "Modifier la dévotion" };

export default async function EditDevotionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const devotion = await prisma.devotion.findUnique({ where: { id } });
  if (!devotion) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Modifier « {devotion.title} »</h1>
        <TransformToReel sourceType="DEVOTION" sourceId={id} />
      </div>
      <DevotionForm devotion={devotion} />
    </div>
  );
}
