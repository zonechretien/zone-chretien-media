export function AudiomackEmbed({ url, title }: { url: string; title: string }) {
  if (!url) return null;

  return (
    <iframe
      title={`Lecteur Audiomack — ${title}`}
      width="100%"
      height="252"
      allow="autoplay"
      src={url}
      className="w-full rounded-2xl border border-border"
    />
  );
}
