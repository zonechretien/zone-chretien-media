import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { getBibleBooks } from "@/lib/queries/bible";
import { ReadingPlanForm } from "@/components/admin/forms/reading-plan-form";

export const metadata: Metadata = { title: "Modifier le plan de lecture" };

export default async function EditReadingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  const [plan, books] = await Promise.all([
    prisma.readingPlan.findUnique({
      where: { id },
      include: { days: { include: { passages: { orderBy: { position: "asc" } } } } },
    }),
    getBibleBooks(),
  ]);
  if (!plan) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {plan.title} »</h1>
      <ReadingPlanForm plan={plan} books={books} />
    </div>
  );
}
