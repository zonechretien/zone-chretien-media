"use client";

import { Download } from "lucide-react";

function toCsv(rows: { email: string; firstName: string | null; createdAt: Date }[]) {
  const header = "email,prenom,date_inscription";
  const lines = rows.map((r) =>
    [r.email, r.firstName ?? "", r.createdAt.toISOString()].map((v) => `"${v.replace(/"/g, '""')}"`).join(","),
  );
  return [header, ...lines].join("\n");
}

export function NewsletterExportButton({
  subscribers,
}: {
  subscribers: { email: string; firstName: string | null; createdAt: Date }[];
}) {
  function handleExport() {
    const csv = toCsv(subscribers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-abonnes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={subscribers.length === 0}
      className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold disabled:opacity-50"
    >
      <Download size={16} /> Exporter en CSV
    </button>
  );
}
