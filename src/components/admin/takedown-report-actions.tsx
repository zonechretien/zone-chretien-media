"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteTakedownReport, updateTakedownReportStatus } from "@/lib/actions/takedown-reports";
import { TAKEDOWN_STATUSES, TAKEDOWN_STATUS_LABELS } from "@/lib/validations/takedown-reports";
import { selectClass } from "@/components/admin/form-fields";

export function TakedownReportActions({ id, status }: { id: string; status: (typeof TAKEDOWN_STATUSES)[number] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(newStatus: (typeof TAKEDOWN_STATUSES)[number]) {
    setError(null);
    startTransition(async () => {
      const result = await updateTakedownReportStatus(id, newStatus);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer ce signalement ? Cette action est irréversible.")) return;
    startDeleteTransition(async () => {
      await deleteTakedownReport(id);
      router.push("/admin/signalements");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={status}
        disabled={pending}
        onChange={(e) => handleStatusChange(e.target.value as (typeof TAKEDOWN_STATUSES)[number])}
        className={selectClass}
      >
        {TAKEDOWN_STATUSES.map((s) => (
          <option key={s} value={s}>{TAKEDOWN_STATUS_LABELS[s]}</option>
        ))}
      </select>
      {pending && <Loader2 size={16} className="animate-spin text-muted" />}
      {error && <span className="text-xs text-red-500">{error}</span>}

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground/70 transition hover:border-red-400 hover:text-red-500 disabled:opacity-50"
      >
        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        Supprimer
      </button>
    </div>
  );
}
