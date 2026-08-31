"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

export type Track = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  artistSlug: string;
  imageUrl: string;
  audioUrl: string;
};

type AudioPlayerContextValue = {
  /** Joue `track`. Si `queue` est fourni (ex. la liste affichée sur la page), les
   * boutons précédent/suivant naviguent dedans ; sinon la piste joue seule. */
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer doit être utilisé dans AudioPlayerProvider");
  return ctx;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [previousVolume, setPreviousVolume] = useState(0.8);

  // Miroirs "impératifs" de queue/queueIndex : l'écran verrouillé (Media Session
  // nexttrack/previoustrack) et l'enchaînement automatique (événement "ended")
  // doivent piloter directement l'élément <audio> sans attendre un re-render React,
  // car le scheduler de React peut être fortement retardé pendant que la page/PWA
  // est en arrière-plan (écran éteint) — ce qui, avant ce correctif, bloquait
  // l'avance automatique à la piste suivante une fois l'écran verrouillé.
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  const currentTrack = queue[queueIndex] ?? null;

  const setMediaSessionState = useCallback((track: Track, playing: boolean) => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artistName,
      album: "Zone-Chrétien Media",
      artwork: [
        { src: track.imageUrl, sizes: "96x96", type: "image/jpeg" },
        { src: track.imageUrl, sizes: "256x256", type: "image/jpeg" },
        { src: track.imageUrl, sizes: "512x512", type: "image/jpeg" },
      ],
    });
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, []);

  /** Charge (si besoin) et lance la piste à `index`, directement sur l'élément
   * <audio> — c'est le seul chemin par lequel une piste démarre, que ce soit un
   * clic utilisateur, l'enchaînement automatique ou une action de l'écran
   * verrouillé, pour garantir un comportement fiable en arrière-plan. */
  const loadedTrackIdRef = useRef<string | null>(null);
  const loadAndPlay = useCallback(
    (index: number) => {
      const list = queueRef.current;
      const track = list[index];
      const audio = audioRef.current;
      if (!track || !audio) return;

      queueIndexRef.current = index;
      if (loadedTrackIdRef.current !== track.id) {
        audio.src = track.audioUrl;
        loadedTrackIdRef.current = track.id;
      }
      audio.play().catch(() => setIsPlaying(false));
      setMediaSessionState(track, true);
      setQueueIndex(index);
      setIsPlaying(true);
    },
    [setMediaSessionState],
  );

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      const list = newQueue && newQueue.length > 0 ? newQueue : [track];
      const idx = list.findIndex((t) => t.id === track.id);
      queueRef.current = list;
      setQueue(list);
      loadAndPlay(idx >= 0 ? idx : 0);
    },
    [loadAndPlay],
  );

  const play = useCallback(() => {
    const audio = audioRef.current;
    const track = queueRef.current[queueIndexRef.current];
    if (!audio || !track) return;
    audio.play().catch(() => setIsPlaying(false));
    setMediaSessionState(track, true);
    setIsPlaying(true);
  }, [setMediaSessionState]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    const track = queueRef.current[queueIndexRef.current];
    audio?.pause();
    if (track) setMediaSessionState(track, false);
    setIsPlaying(false);
  }, [setMediaSessionState]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !queueRef.current[queueIndexRef.current]) return;
    if (audio.paused) play();
    else pause();
  }, [play, pause]);

  const next = useCallback(() => {
    const nextIndex = queueIndexRef.current + 1;
    if (nextIndex < queueRef.current.length) loadAndPlay(nextIndex);
  }, [loadAndPlay]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prevIndex = queueIndexRef.current - 1;
    if (prevIndex >= 0) loadAndPlay(prevIndex);
  }, [loadAndPlay]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (v > 0) setPreviousVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    setVolume((v) => (v > 0 ? 0 : previousVolume || 0.8));
  }, [previousVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // Écouteurs enregistrés une seule fois (jamais réattachés) : "onEnded" lit
  // queueRef/queueIndexRef au moment où il se déclenche, jamais une closure figée,
  // et enchaîne via loadAndPlay — donc même si l'écran est verrouillé et que React
  // n'a pas encore eu l'occasion de re-render, la piste suivante démarre bien.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const nextIndex = queueIndexRef.current + 1;
      if (nextIndex < queueRef.current.length) {
        loadAndPlay(nextIndex);
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [loadAndPlay]);

  // Media Session : contrôles sur l'écran verrouillé / notification système
  // (Android, PWA installée, et centre de contrôle iOS). Les métadonnées et le
  // playbackState sont mis à jour de façon impérative dans play/pause/loadAndPlay
  // ci-dessus (pas ici) pour ne jamais dépendre du cycle de rendu React.
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", previous);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    try {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime == null) return;
        seek(details.seekTime);
      });
    } catch {
      // "seekto" n'est pas supporté par tous les navigateurs (ex. anciennes
      // versions de Safari iOS) — on ignore silencieusement dans ce cas.
    }

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      try {
        navigator.mediaSession.setActionHandler("seekto", null);
      } catch {}
    };
  }, [play, pause, previous, next, seek]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("mediaSession" in navigator) ||
      !("setPositionState" in navigator.mediaSession) ||
      !duration
    ) {
      return;
    }
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch {
      // Peut lever si les valeurs sont temporairement incohérentes pendant un
      // changement de piste (duration pas encore chargée) — sans conséquence.
    }
  }, [currentTime, duration]);

  return (
    <AudioPlayerContext.Provider value={{ playTrack, togglePlay, currentTrack, isPlaying }}>
      {children}
      {/* Toujours monté (même sans piste) pour ne jamais perdre l'état de lecture
          entre deux navigations de page côté client. Pas de prop `src` ici : elle
          est gérée entièrement de façon impérative par loadAndPlay (voir plus haut)
          — sinon React réassignerait `.src` à chaque re-render (même à une valeur
          identique), ce qui relance le chargement et coupe la lecture en cours. */}
      <audio ref={audioRef} />
      {currentTrack && <div className="h-[72px]" aria-hidden />}
      {currentTrack && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-brand-gold bg-brand-navy px-4 py-2.5 shadow-[0_-4px_30px_rgba(0,0,0,0.3)] sm:gap-5 sm:px-6">
          <Link
            href={`/chansons/${currentTrack.slug}`}
            className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-blue to-brand-gold"
          >
            <Image src={currentTrack.imageUrl} alt={currentTrack.title} fill className="object-cover" sizes="46px" />
          </Link>

          <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
            <p className="truncate font-body text-[13px] font-semibold text-white">{currentTrack.title}</p>
            <Link
              href={`/artistes/${currentTrack.artistSlug}`}
              className="block truncate text-[11px] text-brand-gray hover:text-brand-gold"
            >
              {currentTrack.artistName}
            </Link>
          </div>

          <div className="hidden items-center gap-3.5 sm:flex">
            <button
              type="button"
              onClick={previous}
              disabled={queueIndex === 0}
              aria-label="Piste précédente"
              className="rounded-full p-1.5 text-brand-gray transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Mettre en pause" : "Lire"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-navy transition hover:scale-105 hover:bg-brand-gold-light"
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              disabled={queueIndex + 1 >= queue.length}
              aria-label="Piste suivante"
              className="rounded-full p-1.5 text-brand-gray transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Mettre en pause" : "Lire"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy sm:hidden"
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <div className="hidden flex-[2] items-center gap-2.5 md:flex">
            <span className="w-9 shrink-0 text-right font-body text-[11px] text-brand-gray">
              {formatTime(currentTime)}
            </span>
            <ProgressBar current={currentTime} duration={duration} onSeek={seek} />
            <span className="w-9 shrink-0 font-body text-[11px] text-brand-gray">{formatTime(duration)}</span>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={volume > 0 ? "Couper le son" : "Rétablir le son"}
              className="text-brand-gray transition hover:text-white"
            >
              {volume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1 w-[70px] cursor-pointer accent-brand-blue-bright"
            />
          </div>
        </div>
      )}
    </AudioPlayerContext.Provider>
  );
}

function ProgressBar({
  current,
  duration,
  onSeek,
}: {
  current: number;
  duration: number;
  onSeek: (time: number) => void;
}) {
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  return (
    <div
      role="slider"
      aria-label="Progression"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(current)}
      className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/15"
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
