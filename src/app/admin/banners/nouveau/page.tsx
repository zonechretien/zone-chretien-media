import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/session";
import { BannerForm } from "@/components/admin/forms/banner-form";

export const metadata: Metadata = { title: "Nouvelle bannière" };

export default async function NewBannerPage() {
  await requireAdminRole();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle zone de monétisation</h1>
      <BannerForm />
    </div>
  );
}
