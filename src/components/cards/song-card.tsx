import Image from "next/image";
import Link from "next/link";
import { Play, Eye } from "lucide-react";
import type { Artist, Category, Song } from "@prisma/client";
import { formatDateShort, formatViews } from "@/lib/utils";

export function SongCard({
  song,
}: {
  song: Song & { artist: Artist; category: Category | null };
}) {
  return (
    <Link
      href={`/chansons/${song.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-navy">
        <Image
          src={song.imageUrl}
          alt={song.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition group-hover:bg-navy/40 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-navy">
            <Play size={20} fill="currentColor" />
          </span>
        </div>
        {song.category && (
          <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-medium text-white">
            {song.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{song.title}</h3>
        <p className="line-clamp-1 text-sm text-muted">{song.artist.name}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{formatDateShort(song.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {formatViews(song.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}
