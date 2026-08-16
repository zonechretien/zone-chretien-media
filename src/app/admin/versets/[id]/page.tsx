import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { VerseForm } from "@/components/admin/forms/verse-form";

export const metadata: Metadata = { title: "Modifier le verset" };

export default async function EditVersePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const verse = await prisma.verse.findUnique({ where: { id } });
  if (!verse) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {verse.reference} »</h1>
      <VerseForm verse={verse} />
    </div>
  );
}
