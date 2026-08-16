import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { InspirationForm } from "@/components/admin/forms/inspiration-form";

export const metadata: Metadata = { title: "Nouvelle inspiration" };

export default async function NewInspirationPage() {
  await requireSession();
  const categories = await prisma.category.findMany({ where: { type: "INSPIRATION" }, orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle inspiration</h1>
      <InspirationForm categories={categories} />
    </div>
  );
}
