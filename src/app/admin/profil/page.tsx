import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { ChangePasswordForm } from "@/components/admin/forms/change-password-form";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Mon profil</h1>
      <p className="mb-6 text-sm text-muted">{session.user.email}</p>
      <div className="max-w-lg">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
