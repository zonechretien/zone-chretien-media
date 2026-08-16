import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { InspirationForm } from "@/components/admin/forms/inspiration-form";

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
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {inspiration.title} »</h1>
      <InspirationForm inspiration={inspiration} categories={categories} />
    </div>
  );
}
