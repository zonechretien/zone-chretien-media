import Image from "next/image";
import { PlayCircle } from "lucide-react";
import type { Artist, Category, Video } from "@prisma/client";
import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "@/lib/utils";
import { markdownToText } from "@/lib/markdown";

export function VideoCard({
  video,
}: {
  video: Video & { artist: Artist | null; category: Category | null };
}) {
  const thumbnail = video.thumbnailUrl ?? getYoutubeThumbnail(video.youtubeUrl);
  const embedUrl = getYoutubeEmbedUrl(video.youtubeUrl);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      <div className="group relative aspect-video overflow-hidden bg-navy">
        {embedUrl ? (
          <details className="group/video h-full w-full">
            <summary className="absolute inset-0 flex cursor-pointer list-none items-center justify-center group-open/video:hidden [&::-webkit-details-marker]:hidden">
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
            </summary>
            <iframe
              src={embedUrl}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </details>
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
          <p className="mt-2 text-xs text-gold">
            {video.artist?.name}
            {video.artist && video.category && " · "}
            {video.category?.name}
          </p>
        )}
      </div>
    </div>
  );
}
