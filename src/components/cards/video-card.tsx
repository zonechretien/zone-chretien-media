"use client";

import Image from "next/image";
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

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      <div className="group relative aspect-video overflow-hidden bg-navy">
        {embedUrl ? (
          <button
            type="button"
            onClick={() => openVideo(embedUrl, video.title)}
            aria-label={`Lire la vidéo ${video.title}`}
            className="absolute inset-0 flex h-full w-full items-center justify-center"
          >
            {thumbnail && (
              <Image
                src={thumbnail}
                alt={video.title}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
            )}
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-lg">
              <PlayCircle size={28} />
            </span>
          </button>
        ) : (
          thumbnail && (
            <Image src={thumbnail} alt={video.title} fill className="object-cover" sizes="100vw" />
          )
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
        <ShareButtons url={video.youtubeUrl} title={video.title} compact className="mt-3" />
      </div>
    </div>
  );
}
