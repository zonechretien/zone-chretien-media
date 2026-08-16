import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  newHref,
  newLabel = "Ajouter",
}: {
  title: string;
  newHref?: string;
  newLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {newHref && (
        <Link
          href={newHref}
          className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-light"
        >
          <Plus size={16} /> {newLabel}
        </Link>
      )}
    </div>
  );
}

export function AdminTable<T extends { id: string }>({
  rows,
  columns,
  actions,
  emptyMessage = "Aucun élément pour le moment.",
}: {
  rows: T[];
  columns: { header: string; cell: (row: T) => ReactNode; className?: string }[];
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            {columns.map((col) => (
              <th key={col.header} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 align-middle ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
              {actions && <td className="px-4 py-3 text-right align-middle">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
