"use client";

import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { Artist, Category, Video } from "@prisma/client";
import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "@/lib/utils";
import { markdownToText } from "@/lib/markdown";
import { useVideoModal } from "@/components/shared/video-modal-provider";
import { ShareButtons } from "@/components/shared/share-buttons";

export function VideoCard({
  video,
}: {
  video: Video & { artist: Artist | null; category: Category | null };
}) {
  const thumbnail = video.thumbnailUrl ?? getYoutubeThumbnail(video.youtubeUrl);
  const embedUrl = getYoutubeEmbedUrl(video.youtubeUrl);
  const { openVideo } = useVideoModal();

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (embedUrl) openVideo(embedUrl, video.title);
  }

  return (
    <Link
      href={`/videos/${video.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-navy">
        {thumbnail && (
          <Image
            src={thumbnail}
            alt={video.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        )}
        {embedUrl && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label={`Lire la vidéo ${video.title}`}
            className="absolute inset-0 flex h-full w-full items-center justify-center"
          >
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-lg transition group-hover:scale-105">
              <PlayCircle size={28} />
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{video.title}</h3>
        {video.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{markdownToText(video.description)}</p>
        )}
        {(video.artist || video.category) && (
          <p className="mt-2 text-xs text-navy dark:text-gold-soft">
            {video.artist?.name}
            {video.artist && video.category && " · "}
            {video.category?.name}
          </p>
        )}
        <ShareButtons url={`/videos/${video.slug}`} title={video.title} compact className="mt-3" />
      </div>
    </Link>
  );
}
