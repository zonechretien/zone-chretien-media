import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { InspirationForm } from "@/components/admin/forms/inspiration-form";
import { TransformToReel } from "@/components/admin/reels/transform-to-reel";

export const metadata: Metadata = { title: "Modifier l'inspiration" };

export default async function EditInspirationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [inspiration, categories] = await Promise.all([
    prisma.inspiration.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { type: "INSPIRATION" }, orderBy: { name: "asc" } }),
  ]);
  if (!inspiration) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Modifier « {inspiration.title} »</h1>
        <TransformToReel sourceType="INSPIRATION" sourceId={id} />
      </div>
      <InspirationForm inspiration={inspiration} categories={categories} />
    </div>
  );
}
