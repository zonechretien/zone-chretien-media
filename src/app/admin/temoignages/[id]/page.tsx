import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { TestimonyForm } from "@/components/admin/forms/testimony-form";

export const metadata: Metadata = { title: "Modifier le témoignage" };

export default async function EditTestimonyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const testimony = await prisma.testimony.findUnique({ where: { id } });
  if (!testimony) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {testimony.title} »</h1>
      <TestimonyForm testimony={testimony} />
    </div>
  );
}
