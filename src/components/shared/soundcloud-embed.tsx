export function SoundCloudEmbed({ url, title }: { url: string; title: string }) {
  if (!url) return null;

  return (
    <iframe
      title={`Lecteur SoundCloud — ${title}`}
      width="100%"
      height="166"
      allow="autoplay"
      src={url}
      className="w-full rounded-2xl border border-border"
    />
  );
}
