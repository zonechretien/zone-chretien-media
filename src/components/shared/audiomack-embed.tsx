import { getAudiomackEmbedUrl } from "@/lib/utils";

export function AudiomackEmbed({ url, title }: { url: string; title: string }) {
  const embedUrl = getAudiomackEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <iframe
      title={`Lecteur Audiomack — ${title}`}
      width="100%"
      height="252"
      allow="autoplay"
      src={embedUrl}
      className="w-full rounded-2xl border border-border"
    />
  );
}
