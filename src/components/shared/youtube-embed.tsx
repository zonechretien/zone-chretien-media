"use client";

import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "@/lib/utils";
import { useVideoModal } from "@/components/shared/video-modal-provider";

export function YoutubeEmbed({ url, title }: { url: string; title: string }) {
  const embedUrl = getYoutubeEmbedUrl(url);
  const thumbnail = getYoutubeThumbnail(url);
  const { openVideo } = useVideoModal();
  if (!embedUrl) return null;

  return (
    <button
      type="button"
      onClick={() => openVideo(embedUrl, title)}
      aria-label={`Lire la vidéo ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-navy"
    >
      {thumbnail && (
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(min-width: 768px) 768px, 100vw"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-navy shadow-lg">
          <PlayCircle size={32} />
        </span>
      </span>
    </button>
  );
}
