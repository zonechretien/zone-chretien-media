import Image from "next/image";
import Link from "next/link";
import { Eye, Play } from "lucide-react";
import type { Artist, Category, Song } from "@prisma/client";
import { formatDate, formatViews } from "@/lib/utils";
import { SectionHeading } from "@/components/shared/section-heading";

export function FeaturedSong({
  song,
}: {
  song: Song & { artist: Artist; category: Category | null };
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="À l'affiche" title="Chanson vedette" className="mb-6" />
      <Link
        href={`/chansons/${song.slug}`}
        className="group grid overflow-hidden rounded-3xl border border-border bg-surface-elevated shadow-sm transition hover:border-gold hover:shadow-xl sm:grid-cols-2"
      >
        <div className="relative aspect-square sm:aspect-auto">
          <Image
            src={song.imageUrl}
            alt={song.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 640px) 50vw, 100vw"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition group-hover:bg-navy/40 group-hover:opacity-100">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-navy">
              <Play size={26} fill="currentColor" />
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3 p-8">
          {song.category && (
            <span className="w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy dark:text-gold-soft">
              {song.category.name}
            </span>
          )}
          <h3 className="text-2xl font-bold text-foreground sm:text-3xl">{song.title}</h3>
          <p className="text-lg text-muted">{song.artist.name}</p>
          {song.description && (
            <p className="line-clamp-3 text-sm text-muted">{song.description}</p>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted">
            <span>{formatDate(song.publishedAt ?? song.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Eye size={14} /> {formatViews(song.views)} vues
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
