"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { recordHistory } from "@/lib/personalization";

export type Track = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  artistSlug: string;
  imageUrl: string;
  audioUrl: string;
  /** Lien de la pochette dans le lecteur flottant. Par défaut `/chansons/{slug}` —
   * à fournir explicitement pour toute piste qui n'est pas une Song (ex. une
   * prédication audio de la Bibliothèque, dont la page est `/bibliotheque/{slug}`). */
  href?: string;
  /** `false` pour une chanson dont le sourceType n'est ni FICHIER_DIRECT ni
   * SOUNDCLOUD (ex. Audiomack, YouTube Music) : elle utilise un lecteur dédié sur
   * sa page plutôt que le lecteur flottant. Absent ou `true` = lisible normalement
   * dans le lecteur flottant. */
  playable?: boolean;
  /** "soundcloud" : `audioUrl` est une URL d'intégration SoundCloud (format
   * w.soundcloud.com/player/?url=…), pilotée via le widget JS caché plutôt que
   * l'élément <audio>. Absent = fichier audio direct. */
  source?: "soundcloud";
};

// --- SoundCloud Widget API (https://w.soundcloud.com/player/api.js) ----------
// Typage minimal, volontairement limité à ce que ce fichier utilise réellement.
type SCWidgetEvents = {
  PLAY: string;
  PAUSE: string;
  FINISH: string;
  PLAY_PROGRESS: string;
  READY: string;
  ERROR: string;
};
type SCWidgetInstance = {
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  setVolume: (v: number) => void;
  getDuration: (cb: (ms: number) => void) => void;
  bind: (event: string, listener: (e?: { currentPosition: number }) => void) => void;
};
type SCWidgetCtor = (iframe: HTMLIFrameElement) => SCWidgetInstance;

declare global {
  interface Window {
    SC?: { Widget: SCWidgetCtor & { Events: SCWidgetEvents } };
  }
}

let soundcloudApiPromise: Promise<void> | null = null;

/** Charge une seule fois le script global du widget SoundCloud (idempotent —
 * plusieurs appels concurrents partagent la même promesse). */
function loadSoundcloudApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.SC?.Widget) return Promise.resolve();
  if (soundcloudApiPromise) return soundcloudApiPromise;
  soundcloudApiPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return soundcloudApiPromise;
}

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
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [previousVolume, setPreviousVolume] = useState(0.8);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Miroir synchrone de `isPlaying` : togglePlay() doit savoir immédiatement si la
  // piste SoundCloud active joue ou non pour décider play()/pause(), sans pouvoir
  // interroger le widget de façon synchrone (ses getters sont tous à callback).
  const isPlayingRef = useRef(false);

  // Deux éléments <audio> permanents (jamais démontés) au lieu d'un seul : pendant
  // que l'un joue, l'autre précharge en silence la piste suivante. C'est ce qui
  // rend l'enchaînement automatique fiable écran verrouillé — les navigateurs
  // mobiles bloquent/retardent fortement toute NOUVELLE requête réseau lancée
  // pendant que la page est en arrière-plan, mais laissent filer un chargement déjà
  // amorcé pendant que l'app était encore au premier plan. Basculer vers la piste
  // suivante devient alors un simple changement d'élément "actif", sans requête
  // réseau lancée en arrière-plan. (Note : contrairement à un `fetch()`, charger
  // une URL cross-origin via un élément <audio> ne nécessite pas d'en-têtes CORS
  // — indispensable ici puisque les MP3 sont hébergés sur GitHub, qui n'envoie pas
  // Access-Control-Allow-Origin.)
  const audioElsRef = useRef<[HTMLAudioElement | null, HTMLAudioElement | null]>([null, null]);
  const activeIdxRef = useRef<0 | 1>(0);
  const loadedIdRef = useRef<[string | null, string | null]>([null, null]);
  const setAudioEl0 = useCallback((el: HTMLAudioElement | null) => {
    audioElsRef.current[0] = el;
  }, []);
  const setAudioEl1 = useCallback((el: HTMLAudioElement | null) => {
    audioElsRef.current[1] = el;
  }, []);

  // Widget SoundCloud : un nouvel iframe + une nouvelle instance SC.Widget à
  // chaque piste, plutôt que `widget.load()` réutilisant le même widget — ce
  // dernier est pourtant la méthode documentée par SoundCloud, mais s'est
  // montré peu fiable pour relancer l'autoplay (l'événement ERROR se déclenche
  // et la lecture ne démarre jamais). Recréer l'iframe reproduit à l'identique
  // le chemin de la toute première lecture, qui lui est toujours fiable — même
  // principe que le "mountPoint" hors JSX utilisé pour l'iframe YouTube dans
  // video-modal-provider.tsx. `scContainerRef` est un simple conteneur que React
  // ne gère jamais lui-même : on y insère/retire les iframes à la main.
  const scContainerRef = useRef<HTMLDivElement | null>(null);
  const scIframeRef = useRef<HTMLIFrameElement | null>(null);
  const scWidgetRef = useRef<SCWidgetInstance | null>(null);

  // Miroirs "impératifs" de queue/queueIndex : l'écran verrouillé (Media Session
  // nexttrack/previoustrack) et l'enchaînement automatique (événement "ended")
  // doivent piloter directement les éléments <audio> sans attendre un re-render
  // React, car le scheduler de React peut être fortement retardé pendant que la
  // page/PWA est en arrière-plan (écran éteint).
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

  /** Précharge silencieusement `track` sur l'élément <audio> actuellement inactif
   * (sans jouer), pendant que l'autre élément joue la piste en cours. Ne concerne
   * que les pistes en fichier direct — SoundCloud n'a pas d'équivalent (le widget
   * ne gère qu'une piste à la fois) et n'en a pas besoin, `widget.load()` étant
   * justement conçu pour changer de piste au sein d'un même widget déjà initialisé. */
  const preloadOnIdle = useCallback((track: Track) => {
    if (!track.audioUrl || track.source === "soundcloud") return;
    const idleIdx = activeIdxRef.current === 0 ? 1 : 0;
    const idle = audioElsRef.current[idleIdx];
    if (!idle || loadedIdRef.current[idleIdx] === track.id) return;
    idle.src = track.audioUrl;
    idle.load();
    loadedIdRef.current[idleIdx] = track.id;
  }, []);

  /** Joue `track` (SoundCloud) : crée un nouvel iframe + une nouvelle instance
   * SC.Widget à chaque appel (voir le commentaire sur scContainerRef plus haut).
   * Les écouteurs d'événements sont liés une seule fois par piste, à la
   * création de son widget : ils lisent queueRef/queueIndexRef au moment où ils
   * se déclenchent (jamais une closure figée), exactement comme "ended" sur
   * <audio> ci-dessous. */
  const loadSoundCloudTrack = useCallback((track: Track) => {
    setPlayerError(null);
    const container = scContainerRef.current;
    if (!container || !track.audioUrl) return;

    scIframeRef.current?.remove();
    const iframe = document.createElement("iframe");
    iframe.title = "Lecteur SoundCloud (masqué)";
    iframe.setAttribute("allow", "autoplay");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.cssText = "width:1px;height:1px;border:0;";
    iframe.src = track.audioUrl;
    container.appendChild(iframe);
    scIframeRef.current = iframe;

    loadSoundcloudApi().then(() => {
      // Une piste plus récente a déjà remplacé cet iframe pendant le chargement
      // du script — ignore ce widget devenu obsolète plutôt que de le lier.
      if (!window.SC || scIframeRef.current !== iframe) return;

      const widget = window.SC.Widget(iframe);
      scWidgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        widget.play();
        widget.getDuration((ms) => setDuration(ms / 1000));
      });
      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (e) => {
        if (e) setCurrentTime(e.currentPosition / 1000);
      });
      widget.bind(window.SC.Widget.Events.FINISH, () => {
        if (queueRef.current[queueIndexRef.current]?.source !== "soundcloud") return;
        const nextIndex = queueIndexRef.current + 1;
        if (nextIndex < queueRef.current.length) loadAndPlayRef.current(nextIndex);
        else {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      });
      widget.bind(window.SC.Widget.Events.ERROR, () => {
        setPlayerError("Ce morceau SoundCloud est indisponible (privé, supprimé ou restreint dans votre région).");
        setIsPlaying(false);
        isPlayingRef.current = false;
      });
    });
  }, []);

  /** Toujours à jour vers la dernière version de `loadAndPlay` — nécessaire car les
   * écouteurs du widget SoundCloud ne sont liés qu'une fois (voir plus haut) et ne
   * doivent jamais appeler une closure figée d'une version antérieure. */
  const loadAndPlayRef = useRef<(index: number) => void>(() => {});

  /** Lance la piste à `index` — c'est le seul chemin par lequel une piste démarre,
   * que ce soit un clic utilisateur, l'enchaînement automatique ou une action de
   * l'écran verrouillé. Pour un fichier direct déjà préchargé sur l'élément inactif
   * (cas normal de l'enchaînement automatique), on bascule simplement dessus au lieu
   * de charger une nouvelle URL — donc sans requête réseau lancée en arrière-plan.
   * Pour SoundCloud, délègue à loadSoundCloudTrack (widget partagé, voir ci-dessus). */
  const loadAndPlay = useCallback(
    (index: number) => {
      const list = queueRef.current;
      const track = list[index];
      if (!track) return;

      queueIndexRef.current = index;
      setPlayerError(null);
      setCurrentTime(0);

      if (track.source === "soundcloud") {
        audioElsRef.current[activeIdxRef.current]?.pause();
        loadSoundCloudTrack(track);
      } else {
        scWidgetRef.current?.pause();

        const idleIdx = activeIdxRef.current === 0 ? 1 : 0;
        let audio: HTMLAudioElement | null;

        if (loadedIdRef.current[idleIdx] === track.id && audioElsRef.current[idleIdx]) {
          audioElsRef.current[activeIdxRef.current]?.pause();
          activeIdxRef.current = idleIdx;
          audio = audioElsRef.current[idleIdx];
        } else {
          audio = audioElsRef.current[activeIdxRef.current];
          if (audio && loadedIdRef.current[activeIdxRef.current] !== track.id) {
            audio.src = track.audioUrl;
            loadedIdRef.current[activeIdxRef.current] = track.id;
          }
        }
        if (audio) audio.play().catch(() => { setIsPlaying(false); isPlayingRef.current = false; });
      }

      setMediaSessionState(track, true);
      setQueueIndex(index);
      setIsPlaying(true);
      isPlayingRef.current = true;

      // Précharge la prochaine piste fichier même si celle en cours est du
      // SoundCloud (les deux éléments <audio> sont silencieux tant qu'on ne les
      // active pas) — seule une piste SoundCloud à venir n'a rien à précharger.
      const upcoming = list[index + 1];
      if (upcoming && upcoming.source !== "soundcloud") preloadOnIdle(upcoming);
    },
    [setMediaSessionState, preloadOnIdle, loadSoundCloudTrack],
  );

  useEffect(() => {
    loadAndPlayRef.current = loadAndPlay;
  }, [loadAndPlay]);

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      const list = newQueue && newQueue.length > 0 ? newQueue : [track];
      const idx = list.findIndex((t) => t.id === track.id);
      queueRef.current = list;
      setQueue(list);
      loadAndPlay(idx >= 0 ? idx : 0);
      recordHistory({ type: "song", id: track.slug });
    },
    [loadAndPlay],
  );

  const play = useCallback(() => {
    const track = queueRef.current[queueIndexRef.current];
    if (!track) return;
    if (track.source === "soundcloud") {
      scWidgetRef.current?.play();
    } else {
      const audio = audioElsRef.current[activeIdxRef.current];
      if (!audio) return;
      audio.play().catch(() => { setIsPlaying(false); isPlayingRef.current = false; });
    }
    setMediaSessionState(track, true);
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [setMediaSessionState]);

  const pause = useCallback(() => {
    const track = queueRef.current[queueIndexRef.current];
    if (track?.source === "soundcloud") {
      scWidgetRef.current?.pause();
    } else {
      audioElsRef.current[activeIdxRef.current]?.pause();
    }
    if (track) setMediaSessionState(track, false);
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [setMediaSessionState]);

  const togglePlay = useCallback(() => {
    if (!queueRef.current[queueIndexRef.current]) return;
    if (isPlayingRef.current) pause();
    else play();
  }, [play, pause]);

  const next = useCallback(() => {
    const nextIndex = queueIndexRef.current + 1;
    if (nextIndex < queueRef.current.length) loadAndPlay(nextIndex);
  }, [loadAndPlay]);

  const previous = useCallback(() => {
    const track = queueRef.current[queueIndexRef.current];
    if (track?.source !== "soundcloud") {
      const audio = audioElsRef.current[activeIdxRef.current];
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
    }
    const prevIndex = queueIndexRef.current - 1;
    if (prevIndex >= 0) loadAndPlay(prevIndex);
  }, [loadAndPlay]);

  const seek = useCallback((time: number) => {
    const track = queueRef.current[queueIndexRef.current];
    if (track?.source === "soundcloud") {
      scWidgetRef.current?.seekTo(Math.max(0, time) * 1000);
      setCurrentTime(time);
    } else {
      const audio = audioElsRef.current[activeIdxRef.current];
      if (audio) audio.currentTime = time;
    }
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (v > 0) setPreviousVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    setVolume((v) => (v > 0 ? 0 : previousVolume || 0.8));
  }, [previousVolume]);

  useEffect(() => {
    audioElsRef.current.forEach((audio) => {
      if (audio) audio.volume = volume;
    });
    scWidgetRef.current?.setVolume(volume * 100);
  }, [volume]);

  // Écouteurs attachés une seule fois aux DEUX éléments (jamais réattachés) :
  // seul l'élément actif au moment de l'événement doit affecter l'état — celui en
  // préchargement ne joue jamais (juste `.load()`), mais peut tout de même émettre
  // "loadedmetadata". "onEnded" lit queueRef/queueIndexRef au moment où il se
  // déclenche, jamais une closure figée, et enchaîne via loadAndPlay — donc même
  // écran verrouillé, sans attendre de re-render React.
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    audioElsRef.current.forEach((audio) => {
      if (!audio) return;
      const isActive = () => audio === audioElsRef.current[activeIdxRef.current];
      const onTime = () => {
        if (isActive()) setCurrentTime(audio.currentTime);
      };
      const onLoaded = () => {
        if (isActive()) setDuration(audio.duration || 0);
      };
      const onEnded = () => {
        if (!isActive()) return;
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
      cleanups.push(() => {
        audio.removeEventListener("timeupdate", onTime);
        audio.removeEventListener("loadedmetadata", onLoaded);
        audio.removeEventListener("ended", onEnded);
      });
    });
    return () => cleanups.forEach((fn) => fn());
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
      {/* Toujours montés (même sans piste) pour ne jamais perdre l'état de lecture
          entre deux navigations de page côté client. Pas de prop `src` déclarative :
          elle est gérée entièrement de façon impérative par loadAndPlay/preloadOnIdle
          ci-dessus — sinon React la réassignerait à chaque re-render (même à une
          valeur identique), ce qui relance le chargement et coupe la lecture en cours. */}
      <audio ref={setAudioEl0} />
      <audio ref={setAudioEl1} />
      {/* Conteneur pour l'iframe SoundCloud, recréé à chaque piste — jamais géré
          par React lui-même (voir loadSoundCloudTrack) : l'audio doit continuer
          à streamer depuis SoundCloud, seule l'apparence de leur lecteur est
          masquée au profit du lecteur flottant ci-dessous, piloté via le
          widget JS. */}
      <div ref={scContainerRef} aria-hidden="true" className="fixed left-[-9999px] top-[-9999px]" />
      {currentTrack && <div className="h-[72px]" aria-hidden />}
      {currentTrack && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-brand-gold bg-brand-navy shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
          {playerError && (
            <div className="flex items-center gap-2 border-b border-white/10 bg-red-500/10 px-4 py-1.5 font-body text-[12px] text-red-200 sm:px-6">
              <AlertTriangle size={13} className="shrink-0" />
              <span className="truncate">{playerError}</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6">
          <Link
            href={currentTrack.href ?? `/chansons/${currentTrack.slug}`}
            className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-blue to-brand-gold"
          >
            <Image src={currentTrack.imageUrl} alt={currentTrack.title} fill unoptimized className="object-cover" sizes="46px" />
          </Link>

          <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
            <p className="truncate font-body text-[13px] font-semibold text-white">{currentTrack.title}</p>
            {currentTrack.artistSlug ? (
              <Link
                href={`/artistes/${currentTrack.artistSlug}`}
                className="block truncate text-[11px] text-brand-gray hover:text-brand-gold"
              >
                {currentTrack.artistName}
              </Link>
            ) : (
              <span className="block truncate text-[11px] text-brand-gray">{currentTrack.artistName}</span>
            )}
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
