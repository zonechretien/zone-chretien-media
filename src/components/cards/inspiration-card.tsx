import Image from "next/image";
import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import type { Inspiration } from "@prisma/client";
import { formatDateShort, truncate } from "@/lib/utils";
import { markdownToText } from "@/lib/markdown";

export function InspirationCard({ inspiration }: { inspiration: Inspiration }) {
  return (
    <Link
      href={`/inspirations/${inspiration.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-navy">
        {inspiration.imageUrl ? (
          <Image
            src={inspiration.imageUrl}
            alt={inspiration.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold">
            <Sparkles size={28} />
          </div>
        )}
        {inspiration.videoUrl && (
          <span
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy/80 text-gold"
            aria-label="Vidéo disponible"
          >
            <Play size={13} fill="currentColor" className="ml-0.5" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-2 font-semibold text-foreground">{inspiration.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{truncate(markdownToText(inspiration.content), 110)}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
          <span>{inspiration.author ?? "Zone-Chrétien"}</span>
          <span>{formatDateShort(inspiration.publishedAt ?? inspiration.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
