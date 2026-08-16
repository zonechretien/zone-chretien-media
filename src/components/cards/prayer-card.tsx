import Link from "next/link";
import { HandHeart } from "lucide-react";
import type { Prayer } from "@prisma/client";
import { PRAYER_CATEGORY_LABELS } from "@/lib/validations/prayers";
import { truncate } from "@/lib/utils";

export function PrayerCard({ prayer }: { prayer: Prayer }) {
  return (
    <Link
      href={`/prieres/${prayer.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated p-5 transition hover:border-gold hover:shadow-lg"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold">
        <HandHeart size={14} />
        {PRAYER_CATEGORY_LABELS[prayer.category]}
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold text-foreground">{prayer.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{truncate(prayer.content, 140)}</p>
    </Link>
  );
}
