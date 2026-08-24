"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { Role } from "@prisma/client";
import { setTeamMemberActiveAction, setTeamMemberRoleAction } from "@/lib/actions/users";

export function TeamMemberActions({
  id,
  role,
  active,
}: {
  id: string;
  role: Role;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggleActive() {
    const label = active ? "désactiver" : "réactiver";
    if (!confirm(`Confirmer : ${label} ce compte ?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await setTeamMemberActiveAction(id, !active);
      if (result?.error) setError(result.error);
    });
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Role;
    setError(null);
    startTransition(async () => {
      const result = await setTeamMemberRoleAction(id, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <select
        value={role}
        onChange={handleRoleChange}
        disabled={pending}
        className="rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-foreground disabled:opacity-50"
      >
        <option value="EDITOR">Éditeur</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        type="button"
        onClick={handleToggleActive}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-red-400 hover:text-red-500 disabled:opacity-50"
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : active ? "Désactiver" : "Réactiver"}
      </button>
    </div>
  );
}
