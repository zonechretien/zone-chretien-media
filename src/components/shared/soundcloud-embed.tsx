import { getSoundcloudEmbedUrl } from "@/lib/utils";

export function SoundCloudEmbed({ url, title }: { url: string; title: string }) {
  const embedUrl = getSoundcloudEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <iframe
      title={`Lecteur SoundCloud — ${title}`}
      width="100%"
      height="166"
      allow="autoplay"
      src={embedUrl}
      className="w-full rounded-2xl border border-border"
    />
  );
}
