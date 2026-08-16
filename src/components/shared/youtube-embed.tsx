import { getYoutubeEmbedUrl } from "@/lib/utils";

export function YoutubeEmbed({ url, title }: { url: string; title: string }) {
  const embedUrl = getYoutubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-navy">
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
