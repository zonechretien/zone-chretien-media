"use client";

import Image from "next/image";
import { Eye, Play } from "lucide-react";
import type { Artist, Category, Video } from "@prisma/client";
import { getYoutubeEmbedUrl, getYoutubeThumbnail } from "@/lib/utils";
import { useVideoModal } from "@/components/shared/video-modal-provider";
import { HomeSectionHeader } from "@/components/home/section-header";

export function VideosSection({
  videos,
}: {
  videos: (Video & { artist: Artist | null; category: Category | null })[];
}) {
  const { openVideo } = useVideoModal();
  if (videos.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <HomeSectionHeader title="Dernières vidéos" href="/videos" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const thumbnail = video.thumbnailUrl ?? getYoutubeThumbnail(video.youtubeUrl);
          const embedUrl = getYoutubeEmbedUrl(video.youtubeUrl);
          return (
            <button
              key={video.id}
              type="button"
              onClick={() => embedUrl && openVideo(embedUrl, video.title)}
              className="group overflow-hidden rounded-2xl bg-brand-navy text-left shadow-brand-sm transition hover:-translate-y-1 hover:shadow-brand-lg"
            >
              <div className="relative aspect-video overflow-hidden">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <Play size={40} />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-navy/80" />
                <span className="absolute bottom-2.5 right-2.5 rounded bg-[#b83a2a] px-2 py-0.5 font-body text-[9px] font-bold text-white">
                  YouTube
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brand-navy">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </span>
                </div>
              </div>
              <div className="p-3.5">
                <h3 className="mb-1.5 line-clamp-1 font-body text-[13px] font-semibold text-white">{video.title}</h3>
                <div className="flex items-center gap-3 font-body text-[11px] text-white/65">
                  <span className="flex items-center gap-1">
                    <Eye size={10} />
                    {video.views.toLocaleString("fr-FR")} vues
                  </span>
                  {video.artist && <span>{video.artist.name}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
