import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function StatTile({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-5 transition hover:border-gold hover:shadow-md">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString("fr-FR")}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
