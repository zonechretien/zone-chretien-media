import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { TestimonyForm } from "@/components/admin/forms/testimony-form";
import { TransformToReel } from "@/components/admin/reels/transform-to-reel";

export const metadata: Metadata = { title: "Modifier le témoignage" };

export default async function EditTestimonyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const testimony = await prisma.testimony.findUnique({ where: { id } });
  if (!testimony) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Modifier « {testimony.title} »</h1>
        <TransformToReel sourceType="TESTIMONY" sourceId={id} />
      </div>
      <TestimonyForm testimony={testimony} />
    </div>
  );
}
