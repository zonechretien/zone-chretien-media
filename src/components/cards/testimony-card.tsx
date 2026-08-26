import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import type { Testimony } from "@prisma/client";
import { formatDateShort, truncate } from "@/lib/utils";
import { markdownToText } from "@/lib/markdown";

export function TestimonyCard({ testimony }: { testimony: Testimony }) {
  return (
    <Link
      href={`/temoignages/${testimony.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated p-5 transition hover:border-gold hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-navy">
          {testimony.imageUrl ? (
            <Image src={testimony.imageUrl} alt={testimony.authorName} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gold">
              <UserRound size={18} />
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{testimony.authorName}</p>
          <p className="text-xs text-muted">{formatDateShort(testimony.publishedAt ?? testimony.createdAt)}</p>
        </div>
      </div>
      <h3 className="mt-3 line-clamp-2 font-semibold text-foreground">{testimony.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{truncate(markdownToText(testimony.content), 140)}</p>
    </Link>
  );
}
