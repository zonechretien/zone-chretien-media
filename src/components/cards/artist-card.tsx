import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import type { Artist } from "@prisma/client";

export function ArtistCard({
  artist,
}: {
  artist: Artist & { _count: { songs: number } };
}) {
  return (
    <Link
      href={`/artistes/${artist.slug}`}
      className="group flex flex-col items-center rounded-2xl border border-border bg-surface-elevated p-5 text-center transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-navy">
        {artist.photoUrl ? (
          <Image
            src={artist.photoUrl}
            alt={artist.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold">
            <User size={32} />
          </div>
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 font-semibold text-foreground">{artist.name}</h3>
      <p className="text-xs text-muted">
        {artist._count.songs} chanson{artist._count.songs > 1 ? "s" : ""}
      </p>
    </Link>
  );
}
