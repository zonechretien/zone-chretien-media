import Image from "next/image";
import Link from "next/link";
import { ListMusic, Play } from "lucide-react";
import type { PlaylistType } from "@prisma/client";

export type PlaylistCardData = {
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  type: PlaylistType;
  _count: { songs: number };
};

export function PlaylistCard({ playlist }: { playlist: PlaylistCardData }) {
  const isSpecial = playlist.type !== "EDITORIALE";

  return (
    <Link
      href={`/playlists/${playlist.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-navy">
        {playlist.imageUrl ? (
          <Image
            src={playlist.imageUrl}
            alt={playlist.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <ListMusic size={40} />
          </div>
        )}
        {isSpecial && (
          <span className="absolute left-2 top-2 rounded-full bg-navy/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            🔥 Classement automatique
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition group-hover:bg-navy/40 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-navy">
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{playlist.title}</h3>
        {playlist.description && (
          <p className="line-clamp-2 text-sm text-muted">{playlist.description}</p>
        )}
        <span className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <ListMusic size={12} />
          {playlist._count.songs} {playlist._count.songs > 1 ? "chansons" : "chanson"}
        </span>
      </div>
    </Link>
  );
}
