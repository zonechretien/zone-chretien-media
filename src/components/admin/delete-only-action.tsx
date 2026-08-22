"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteOnlyAction({
  onDelete,
  itemLabel,
}: {
  onDelete: () => Promise<{ error?: string } | void>;
  itemLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Supprimer « ${itemLabel} » ? Cette action est irréversible.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {error && <span className="mr-2 text-xs text-red-500">{error}</span>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground/70 transition hover:border-red-400 hover:text-red-500 disabled:opacity-50"
        aria-label="Supprimer"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}
