import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { PrayerForm } from "@/components/admin/forms/prayer-form";

export const metadata: Metadata = { title: "Nouvelle prière" };

export default async function NewPrayerPage() {
  await requireSession();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle prière</h1>
      <PrayerForm />
    </div>
  );
}
