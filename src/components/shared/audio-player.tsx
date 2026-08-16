export function AudioPlayer({ src, title }: { src: string; title: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <audio controls preload="none" className="w-full" aria-label={`Lecteur audio — ${title}`}>
        <source src={src} />
        Votre navigateur ne supporte pas la lecture audio.
      </audio>
    </div>
  );
}
