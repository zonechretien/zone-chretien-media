import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { DevotionForm } from "@/components/admin/forms/devotion-form";

export const metadata: Metadata = { title: "Modifier la dévotion" };

export default async function EditDevotionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const devotion = await prisma.devotion.findUnique({ where: { id } });
  if (!devotion) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {devotion.title} »</h1>
      <DevotionForm devotion={devotion} />
    </div>
  );
}
