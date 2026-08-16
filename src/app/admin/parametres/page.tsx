import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/admin/forms/settings-form";

export const metadata: Metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  await requireAdminRole();
  const settings = await prisma.settings.upsert({
    where: { id: "settings" },
    update: {},
    create: { id: "settings" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Paramètres du site</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
