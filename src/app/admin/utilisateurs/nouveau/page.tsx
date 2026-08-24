import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/admin/session";
import { TeamMemberForm } from "@/components/admin/forms/team-member-form";

export const metadata: Metadata = { title: "Ajouter un compte" };

export default async function NewTeamMemberPage() {
  await requireSuperAdmin();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Ajouter un compte</h1>
      <div className="max-w-lg">
        <TeamMemberForm />
      </div>
    </div>
  );
}
