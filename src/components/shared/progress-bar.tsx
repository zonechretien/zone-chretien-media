"use client";

export function ProgressBar({
  current,
  duration,
  onSeek,
  className,
}: {
  current: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}) {
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  return (
    <div
      role="slider"
      aria-label="Progression"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(current)}
      className={className ?? "relative h-1 flex-1 cursor-pointer rounded-full bg-white/15"}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        onSeek(Math.max(0, Math.min(1, ratio)) * duration);
      }}
    >
      <div
        className="relative h-full rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-light"
        style={{ width: `${pct}%` }}
      >
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white shadow-[0_0_6px_rgba(232,160,32,0.6)]" />
      </div>
    </div>
  );
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
