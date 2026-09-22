"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { recordHistory } from "@/lib/personalization";
import { getAutoplayQueueAction } from "@/lib/actions/player";
import {
  loadYoutubeIframeApi,
  EMBED_RESTRICTED_ERROR_CODES,
  type YTPlayerInstance,
} from "@/lib/youtube-iframe-api";
import { NowPlayingBar } from "@/components/shared/now-playing-bar";
import { NowPlayingOverlay } from "@/components/shared/now-playing-overlay";
import { PipDocumentContent } from "@/components/shared/pip-document-content";

// --- Document Picture-in-Picture API (Chrome/Edge, Firefox 151+) -------------
// Pas encore dans les types DOM standard — déclaration minimale, même
// convention que window.SC/window.YT ci-dessous.
interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

export type PipSupport = "document" | "video" | "none";

export type Track = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  artistSlug: string;
  imageUrl: string;
  /** Pour `source: "youtube"`, c'est l'ID vidéo (11 caractères), pas l'URL
   * complète — c'est ce qu'attend `YT.Player.loadVideoById`. */
  audioUrl: string;
  /** Lien de la pochette dans le lecteur flottant. Par défaut `/chansons/{slug}` —
   * à fournir explicitement pour toute piste qui n'est pas une Song (ex. une
   * prédication audio de la Bibliothèque, dont la page est `/bibliotheque/{slug}`). */
  href?: string;
  /** `false` si la piste n'a aucune source de lecture exploitable (aucun ID
   * YouTube reconnu). Absent ou `true` = lisible normalement. */
  playable?: boolean;
  /** "soundcloud" : `audioUrl` est une URL d'intégration SoundCloud, pilotée via
   * le widget JS caché. "youtube" : `audioUrl` est un ID vidéo YouTube, pilotée
   * via l'API IFrame Player (voir le moteur YouTube plus bas). Absent = fichier
   * audio direct via l'élément <audio>. */
  source?: "soundcloud" | "youtube";
  /** Paroles de la chanson (si disponibles) — alimente l'onglet "Paroles" du
   * panneau "en cours de lecture" sans requête supplémentaire. */
  lyrics?: string;
  /** "song" marque une piste comme une vraie chanson (par opposition à une
   * piste Bibliothèque) — seules les pistes "song" sont éligibles à la
   * lecture automatique (chansons similaires en fin de file). */
  kind?: "song";
};

export type RepeatMode = "off" | "all" | "one";

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
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playerError: string | null;
  queue: Track[];
  queueIndex: number;
  /** File restante à venir, dans l'ordre réel de lecture (respecte l'aléatoire
   * si actif) — c'est cette liste que le panneau "À suivre" doit afficher,
   * pas `queue` brut (qui reste dans l'ordre d'insertion). */
  upcomingQueue: Track[];
  /** Saute directement à `track` si elle est dans la file actuelle. */
  playFromQueue: (track: Track) => void;
  volume: number;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  cycleRepeatMode: () => void;
  autoplay: boolean;
  toggleAutoplay: () => void;
  addToQueue: (tracks: Track[]) => void;
  isExpanded: boolean;
  expand: () => void;
  collapse: () => void;
  toggleExpanded: () => void;
  /** "none" : cache le bouton fenêtre flottante — aucune des deux API n'est
   * disponible sur ce navigateur. */
  pipSupport: PipSupport;
  pipOpen: boolean;
  togglePip: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer doit être utilisé dans AudioPlayerProvider");
  return ctx;
}

/** Mélange Fisher-Yates du sous-tableau `arr[from..]` (en place, retourne une copie). */
function shuffleFrom<T>(arr: T[], from: number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > from; i--) {
    const j = from + Math.floor(Math.random() * (i - from + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  // `playOrder` est une permutation des indices de `queue` — l'ordre réel de
  // lecture (naturel, ou mélangé si `shuffle` est actif). `queueIndex` (exposé
  // dans le contexte pour compat) est dérivé : playOrder[playOrderPos].
  const [playOrder, setPlayOrder] = useState<number[]>([]);
  const [playOrderPos, setPlayOrderPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [previousVolume, setPreviousVolume] = useState(0.8);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [autoplay, setAutoplay] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fenêtre flottante (Picture-in-Picture) — support détecté une seule fois,
  // paresseusement (pas de useEffect : évite un re-render supplémentaire au
  // montage, et window n'existe de toute façon qu'au premier rendu client).
  const [pipSupport] = useState<PipSupport>(() => {
    if (typeof window === "undefined") return "none";
    if ("documentPictureInPicture" in window) return "document";
    if (document.pictureInPictureEnabled && "captureStream" in HTMLCanvasElement.prototype) return "video";
    return "none";
  });
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [videoPipOpen, setVideoPipOpen] = useState(false);
  const pipCanvasRef = useRef<HTMLCanvasElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  // Miroir synchrone de `isPlaying` : togglePlay() doit savoir immédiatement si la
  // piste active joue ou non pour décider play()/pause(), sans pouvoir interroger
  // certains lecteurs de façon synchrone (SoundCloud n'a que des getters à callback).
  const isPlayingRef = useRef(false);

  // Deux éléments <audio> permanents (jamais démontés) au lieu d'un seul : pendant
  // que l'un joue, l'autre précharge en silence la piste suivante (fichiers directs
  // uniquement — voir preloadOnIdle plus bas pour le détail de ce choix).
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
  // chaque piste (voir loadSoundCloudTrack ci-dessous pour le détail).
  const scContainerRef = useRef<HTMLDivElement | null>(null);
  const scIframeRef = useRef<HTMLIFrameElement | null>(null);
  const scWidgetRef = useRef<SCWidgetInstance | null>(null);

  // Moteur YouTube : une SEULE instance YT.Player persistante (pas une par
  // piste) — les pistes suivantes appellent `loadVideoById` dessus, mécanisme
  // standard documenté par YouTube pour l'avance de "playlist".
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytPlayerPromiseRef = useRef<Promise<YTPlayerInstance> | null>(null);
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Miroirs "impératifs" : l'écran verrouillé (Media Session nexttrack/
  // previoustrack) et l'enchaînement automatique (fin de piste, quel que soit
  // le moteur) doivent piloter directement les éléments/lecteurs sans attendre
  // un re-render React, car le scheduler React peut être fortement retardé
  // pendant que la page/PWA est en arrière-plan (écran éteint).
  const queueRef = useRef<Track[]>([]);
  const playOrderRef = useRef<number[]>([]);
  const playOrderPosRef = useRef(0);
  const repeatModeRef = useRef<RepeatMode>("off");
  const autoplayRef = useRef(false);
  const autoplayFetchedForRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    playOrderRef.current = playOrder;
  }, [playOrder]);
  useEffect(() => {
    playOrderPosRef.current = playOrderPos;
  }, [playOrderPos]);
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);
  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  const queueIndex = playOrder[playOrderPos] ?? 0;
  const currentTrack = queue[queueIndex] ?? null;
  const upcomingQueue = useMemo(
    () => playOrder.slice(playOrderPos + 1).map((i) => queue[i]).filter((t): t is Track => !!t),
    [playOrder, playOrderPos, queue],
  );

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
   * (sans jouer). Ne concerne que les pistes en fichier direct — SoundCloud et
   * YouTube n'ont pas d'équivalent utile ici (un seul widget/player à la fois). */
  const preloadOnIdle = useCallback((track: Track) => {
    if (!track.audioUrl || track.source === "soundcloud" || track.source === "youtube") return;
    const idleIdx = activeIdxRef.current === 0 ? 1 : 0;
    const idle = audioElsRef.current[idleIdx];
    if (!idle || loadedIdRef.current[idleIdx] === track.id) return;
    idle.src = track.audioUrl;
    idle.load();
    loadedIdRef.current[idleIdx] = track.id;
  }, []);

  /** Toujours à jour vers la dernière version de `loadAndPlay` — nécessaire car les
   * écouteurs SoundCloud/YouTube ne sont liés qu'une fois et ne doivent jamais
   * appeler une closure figée d'une version antérieure. */
  const loadAndPlayRef = useRef<(index: number) => void>(() => {});

  /** Avance/arrête en fin de piste — appelée par les TROIS moteurs (`ended` de
   * <audio>, `FINISH` SoundCloud, état ENDED de YouTube) : point central où
   * aléatoire/répétition/lecture automatique prennent leur décision, au lieu
   * de dupliquer cette logique par moteur. `isError` (piste YouTube bloquée) :
   * avance toujours d'un cran, ignore repeatMode "one"/"all" (répéter/boucler
   * une piste cassée n'a pas de sens). */
  const handleTrackEndedRef = useRef<(opts?: { isError?: boolean }) => void>(() => {});
  const handleTrackEnded = useCallback((opts: { isError?: boolean } = {}) => {
    if (!opts.isError && repeatModeRef.current === "one") {
      loadAndPlayRef.current(playOrderRef.current[playOrderPosRef.current]);
      return;
    }
    const newPos = playOrderPosRef.current + 1;
    if (newPos < playOrderRef.current.length) {
      playOrderPosRef.current = newPos;
      setPlayOrderPos(newPos);
      loadAndPlayRef.current(playOrderRef.current[newPos]);
      return;
    }
    if (!opts.isError && repeatModeRef.current === "all" && playOrderRef.current.length > 0) {
      playOrderPosRef.current = 0;
      setPlayOrderPos(0);
      loadAndPlayRef.current(playOrderRef.current[0]);
      return;
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);
  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  /** Ajoute des pistes en fin de file (dédupliquées par id) — utilisé par la
   * lecture automatique pour étendre la file avec des chansons similaires. */
  const addToQueue = useCallback((tracks: Track[]) => {
    const existingIds = new Set(queueRef.current.map((t) => t.id));
    const fresh = tracks.filter((t) => !existingIds.has(t.id));
    if (fresh.length === 0) return;

    const startIndex = queueRef.current.length;
    const newQueue = [...queueRef.current, ...fresh];
    const newOrder = [...playOrderRef.current, ...fresh.map((_, i) => startIndex + i)];
    queueRef.current = newQueue;
    playOrderRef.current = newOrder;
    setQueue(newQueue);
    setPlayOrder(newOrder);
  }, []);

  /** Charge la file "lecture automatique" (chansons similaires) une seule fois
   * par piste — déclenché quand cette piste démarre ET qu'elle est la dernière
   * de la file (pas à sa fin, pour laisser le temps réseau d'arriver avant). */
  const maybeFetchAutoplay = useCallback(
    (track: Track) => {
      if (!autoplayRef.current || repeatModeRef.current === "one") return;
      if (track.kind !== "song") return;
      if (playOrderPosRef.current !== playOrderRef.current.length - 1) return;
      if (autoplayFetchedForRef.current.has(track.id)) return;
      autoplayFetchedForRef.current.add(track.id);

      const excludeIds = queueRef.current.map((t) => t.id);
      getAutoplayQueueAction(track.id, excludeIds)
        .then((tracks) => {
          if (tracks.length > 0) addToQueue(tracks);
        })
        .catch(() => {
          // Silencieux : la lecture automatique est un agrément, pas une
          // fonctionnalité critique — une erreur réseau ne doit rien casser.
        });
    },
    [addToQueue],
  );

  /** Joue `track` (SoundCloud) : crée un nouvel iframe + une nouvelle instance
   * SC.Widget à chaque piste — `widget.load()` réutilisant le même widget est
   * pourtant la méthode documentée par SoundCloud, mais s'est montrée peu
   * fiable pour relancer l'autoplay. Recréer l'iframe reproduit à l'identique
   * le chemin de la toute première lecture, toujours fiable. */
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
        if (queueRef.current[playOrderRef.current[playOrderPosRef.current]]?.source !== "soundcloud") return;
        handleTrackEndedRef.current();
      });
      widget.bind(window.SC.Widget.Events.ERROR, () => {
        setPlayerError("Ce morceau SoundCloud est indisponible (privé, supprimé ou restreint dans votre région).");
        setIsPlaying(false);
        isPlayingRef.current = false;
      });
    });
  }, []);

  /** Crée (une seule fois) l'instance YT.Player persistante, ou la retourne si
   * déjà créée/en cours de création. Conteneur caché en `left:-9999px` (pas
   * `display:none` — un lecteur YouTube peut se dégrader silencieusement si
   * son conteneur est display:none), même convention que le conteneur
   * SoundCloud ci-dessus. */
  const ensureYoutubePlayer = useCallback((initialVideoId: string): Promise<YTPlayerInstance> => {
    if (ytPlayerPromiseRef.current) return ytPlayerPromiseRef.current;
    ytPlayerPromiseRef.current = loadYoutubeIframeApi().then(
      () =>
        new Promise<YTPlayerInstance>((resolve) => {
          const container = ytContainerRef.current;
          if (!container || !window.YT) throw new Error("Conteneur YouTube indisponible");
          const mountPoint = document.createElement("div");
          container.appendChild(mountPoint);
          const player = new window.YT.Player(mountPoint, {
            videoId: initialVideoId,
            host: "https://www.youtube-nocookie.com",
            playerVars: { autoplay: 1, controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1 },
            events: {
              onReady: () => {
                ytPlayerRef.current = player;
                resolve(player);
              },
              onStateChange: (e) => {
                if (e.data === 0) handleTrackEndedRef.current();
              },
              onError: (e) => {
                if (EMBED_RESTRICTED_ERROR_CODES.has(e.data)) {
                  setPlayerError("Cette vidéo n'est plus disponible ici — passage à la suivante.");
                  handleTrackEndedRef.current({ isError: true });
                }
              },
            },
          });
        }),
    );
    return ytPlayerPromiseRef.current;
  }, []);

  /** Lance la piste à `index` (indice dans `queueRef.current`, pas dans
   * `playOrder`) — c'est le seul chemin par lequel une piste démarre, que ce
   * soit un clic utilisateur, l'enchaînement automatique ou une action de
   * l'écran verrouillé. L'appelant (playTrack/next/previous/handleTrackEnded)
   * est responsable de positionner `playOrderPos` avant d'appeler cette
   * fonction — elle ne fait que charger/jouer. */
  const loadAndPlay = useCallback(
    (index: number) => {
      const list = queueRef.current;
      const track = list[index];
      if (!track) return;

      setPlayerError(null);
      setCurrentTime(0);
      setDuration(0);

      if (track.source === "soundcloud") {
        audioElsRef.current[activeIdxRef.current]?.pause();
        if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
        loadSoundCloudTrack(track);
      } else if (track.source === "youtube") {
        audioElsRef.current[activeIdxRef.current]?.pause();
        scWidgetRef.current?.pause();
        const videoId = track.audioUrl;
        if (!videoId) {
          setIsPlaying(false);
          isPlayingRef.current = false;
        } else if (ytPlayerRef.current) {
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.setVolume(volume * 100);
        } else {
          ensureYoutubePlayer(videoId).then((player) => player.setVolume(volume * 100));
        }
      } else {
        scWidgetRef.current?.pause();
        if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();

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
      setIsPlaying(true);
      isPlayingRef.current = true;
      recordHistory({ type: "song", id: track.slug });

      // Précharge la prochaine piste fichier direct de la file (aucun
      // équivalent utile pour SoundCloud/YouTube — un seul lecteur à la fois).
      const nextIndex = playOrderRef.current[playOrderPosRef.current + 1];
      const upcoming = nextIndex !== undefined ? list[nextIndex] : undefined;
      if (upcoming) preloadOnIdle(upcoming);

      maybeFetchAutoplay(track);
    },
    [setMediaSessionState, preloadOnIdle, loadSoundCloudTrack, ensureYoutubePlayer, maybeFetchAutoplay, volume],
  );

  useEffect(() => {
    loadAndPlayRef.current = loadAndPlay;
  }, [loadAndPlay]);

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      const list = newQueue && newQueue.length > 0 ? newQueue : [track];
      const idx = list.findIndex((t) => t.id === track.id);
      const startIdx = idx >= 0 ? idx : 0;
      const order = list.map((_, i) => i);

      queueRef.current = list;
      playOrderRef.current = order;
      playOrderPosRef.current = startIdx;
      setQueue(list);
      setPlayOrder(order);
      setPlayOrderPos(startIdx);
      setShuffle(false);

      loadAndPlay(startIdx);
    },
    [loadAndPlay],
  );

  const play = useCallback(() => {
    const track = queueRef.current[playOrderRef.current[playOrderPosRef.current]];
    if (!track) return;
    if (track.source === "soundcloud") {
      scWidgetRef.current?.play();
    } else if (track.source === "youtube") {
      ytPlayerRef.current?.playVideo();
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
    const track = queueRef.current[playOrderRef.current[playOrderPosRef.current]];
    if (track?.source === "soundcloud") {
      scWidgetRef.current?.pause();
    } else if (track?.source === "youtube") {
      ytPlayerRef.current?.pauseVideo();
    } else {
      audioElsRef.current[activeIdxRef.current]?.pause();
    }
    if (track) setMediaSessionState(track, false);
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [setMediaSessionState]);

  const togglePlay = useCallback(() => {
    if (!queueRef.current[playOrderRef.current[playOrderPosRef.current]]) return;
    if (isPlayingRef.current) pause();
    else play();
  }, [play, pause]);

  const next = useCallback(() => {
    const newPos = playOrderPosRef.current + 1;
    if (newPos < playOrderRef.current.length) {
      playOrderPosRef.current = newPos;
      setPlayOrderPos(newPos);
      loadAndPlay(playOrderRef.current[newPos]);
    }
  }, [loadAndPlay]);

  const previous = useCallback(() => {
    const track = queueRef.current[playOrderRef.current[playOrderPosRef.current]];
    if (track?.source !== "soundcloud" && track?.source !== "youtube") {
      const audio = audioElsRef.current[activeIdxRef.current];
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
    } else if (track?.source === "youtube" && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime() > 3) {
      ytPlayerRef.current.seekTo(0, true);
      return;
    }
    const newPos = playOrderPosRef.current - 1;
    if (newPos >= 0) {
      playOrderPosRef.current = newPos;
      setPlayOrderPos(newPos);
      loadAndPlay(playOrderRef.current[newPos]);
    }
  }, [loadAndPlay]);

  /** Saute directement à `track` — utilisé par le panneau "À suivre" pour un
   * clic sur un élément de la file (déjà présente dans `queue`, quelle que
   * soit sa position dans `playOrder`). */
  const playFromQueue = useCallback(
    (track: Track) => {
      const queueIdx = queueRef.current.findIndex((t) => t.id === track.id);
      if (queueIdx === -1) return;
      const pos = playOrderRef.current.indexOf(queueIdx);
      if (pos === -1) return;
      playOrderPosRef.current = pos;
      setPlayOrderPos(pos);
      loadAndPlay(queueIdx);
    },
    [loadAndPlay],
  );

  const seek = useCallback((time: number) => {
    const track = queueRef.current[playOrderRef.current[playOrderPosRef.current]];
    if (track?.source === "soundcloud") {
      scWidgetRef.current?.seekTo(Math.max(0, time) * 1000);
      setCurrentTime(time);
    } else if (track?.source === "youtube") {
      ytPlayerRef.current?.seekTo(Math.max(0, time), true);
      setCurrentTime(time);
    } else {
      const audio = audioElsRef.current[activeIdxRef.current];
      if (audio) audio.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (v > 0) setPreviousVolume(v);
  }, []);

  const toggleMute = useCallback(() => {
    setVolumeState((v) => (v > 0 ? 0 : previousVolume || 0.8));
  }, [previousVolume]);

  useEffect(() => {
    audioElsRef.current.forEach((audio) => {
      if (audio) audio.volume = volume;
    });
    scWidgetRef.current?.setVolume(volume * 100);
    ytPlayerRef.current?.setVolume(volume * 100);
    if (ytPlayerRef.current) {
      if (volume <= 0) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    }
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    setShuffle((current) => {
      const next = !current;
      if (next) {
        setPlayOrder((order) => shuffleFrom(order, playOrderPosRef.current));
      } else {
        // Reconstruit l'ordre naturel, en repositionnant playOrderPos sur la
        // piste actuellement en cours (reprise "depuis maintenant").
        const currentQueueIdx = playOrderRef.current[playOrderPosRef.current];
        const naturalOrder = queueRef.current.map((_, i) => i);
        setPlayOrder(naturalOrder);
        setPlayOrderPos(currentQueueIdx ?? 0);
      }
      return next;
    });
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const toggleAutoplay = useCallback(() => {
    setAutoplay((a) => !a);
  }, []);

  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);
  const toggleExpanded = useCallback(() => setIsExpanded((e) => !e), []);

  /** Dessine la pochette de `track` sur le canvas caché — utilisé par le repli
   * vidéo (Safari). `crossOrigin` est nécessaire pour que `captureStream()` ne
   * produise pas un flux "tainted" ; si l'hôte de l'image ne renvoie pas les
   * en-têtes CORS voulus, on se rabat sur un simple bloc de couleur + titre
   * plutôt que de bloquer avec une erreur. */
  const drawPipCanvas = useCallback((track: Track): Promise<void> => {
    return new Promise((resolve) => {
      const canvas = pipCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        resolve();
        return;
      }

      const drawFallback = () => {
        ctx.fillStyle = "#0a1628";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e8a020";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(track.title, canvas.width / 2, canvas.height / 2, canvas.width - 40);
        resolve();
      };

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      img.onerror = drawFallback;
      img.src = track.imageUrl;
    });
  }, []);

  const openDocumentPip = useCallback(async () => {
    if (!window.documentPictureInPicture) return;
    const win = await window.documentPictureInPicture.requestWindow({ width: 320, height: 180 });

    // Sans ça la fenêtre PiP est un document vierge, sans styles Tailwind —
    // on clone les feuilles de style déjà chargées par la page principale.
    [...document.styleSheets].forEach((sheet) => {
      try {
        if (sheet.ownerNode instanceof HTMLElement) {
          win.document.head.appendChild(sheet.ownerNode.cloneNode(true));
        }
      } catch {
        // Feuille de style inaccessible (cross-origin) — sans conséquence,
        // les styles utiles de ce site sont tous same-origin.
      }
    });
    // Pas besoin de fond posé sur <body> lui-même : PipDocumentContent
    // couvre déjà tout l'espace avec son propre bg-brand-navy (h-full).

    win.addEventListener("pagehide", () => setPipWindow(null), { once: true });
    setPipWindow(win);
  }, []);

  const closeDocumentPip = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  const openVideoPip = useCallback(async () => {
    const video = pipVideoRef.current;
    const track = queueRef.current[playOrderRef.current[playOrderPosRef.current]];
    if (!video || !track) return;
    // Attendre le dessin réel (le chargement de l'image est asynchrone) avant
    // de capturer le flux — sinon captureStream() démarre sur un canvas
    // encore vide et la vidéo obtient des dimensions nulles.
    await drawPipCanvas(track);

    const canvas = pipCanvasRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(1);
    video.srcObject = stream;
    await video.play();
    await video.requestPictureInPicture();
    setVideoPipOpen(true);
  }, [drawPipCanvas]);

  const closeVideoPip = useCallback(() => {
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    setVideoPipOpen(false);
  }, []);

  const togglePip = useCallback(() => {
    if (pipSupport === "document") {
      if (pipWindow) closeDocumentPip();
      else openDocumentPip();
    } else if (pipSupport === "video") {
      if (videoPipOpen) closeVideoPip();
      else openVideoPip();
    }
  }, [pipSupport, pipWindow, videoPipOpen, openDocumentPip, closeDocumentPip, openVideoPip, closeVideoPip]);

  // Repeint le canvas du repli vidéo à chaque changement de piste tant que la
  // PiP vidéo est ouverte (la fenêtre Document PiP, elle, se redessine toute
  // seule — c'est un composant React normal via le portail plus bas).
  useEffect(() => {
    if (!videoPipOpen || !currentTrack) return;
    drawPipCanvas(currentTrack);
  }, [videoPipOpen, currentTrack, drawPipCanvas]);

  // Relaie les boutons natifs play/pause de la mini-fenêtre Safari vers le
  // vrai lecteur (ce ne sont pas des "contrôles personnalisés" : ce sont les
  // boutons déjà fournis nativement par la PiP vidéo du navigateur).
  useEffect(() => {
    const video = pipVideoRef.current;
    if (!video) return;
    const onLeave = () => setVideoPipOpen(false);
    const onPlay = () => play();
    const onPause = () => pause();
    video.addEventListener("leavepictureinpicture", onLeave);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("leavepictureinpicture", onLeave);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [play, pause]);

  // Sondage de la position/durée pour les pistes YouTube — l'API IFrame n'émet
  // aucun événement "timeupdate" natif contrairement à <audio>.
  useEffect(() => {
    if (ytPollRef.current) {
      clearInterval(ytPollRef.current);
      ytPollRef.current = null;
    }
    if (currentTrack?.source !== "youtube" || !isPlaying) return;
    ytPollRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player) return;
      setCurrentTime(player.getCurrentTime());
      const d = player.getDuration();
      if (d > 0) setDuration(d);
    }, 250);
    return () => {
      if (ytPollRef.current) clearInterval(ytPollRef.current);
    };
  }, [currentTrack?.source, currentTrack?.id, isPlaying]);

  // Écouteurs attachés une seule fois aux DEUX éléments <audio> (jamais
  // réattachés) : seul l'élément actif au moment de l'événement doit affecter
  // l'état. "onEnded" lit les refs au moment où il se déclenche, jamais une
  // closure figée, et enchaîne via handleTrackEndedRef — donc même écran
  // verrouillé, sans attendre de re-render React.
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
        handleTrackEndedRef.current();
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
  }, []);

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

  const contextValue = useMemo<AudioPlayerContextValue>(
    () => ({
      playTrack,
      togglePlay,
      play,
      pause,
      next,
      previous,
      seek,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      playerError,
      queue,
      queueIndex,
      upcomingQueue,
      playFromQueue,
      volume,
      setVolume,
      toggleMute,
      shuffle,
      toggleShuffle,
      repeatMode,
      cycleRepeatMode,
      autoplay,
      toggleAutoplay,
      addToQueue,
      isExpanded,
      expand,
      collapse,
      toggleExpanded,
      pipSupport,
      pipOpen: !!pipWindow || videoPipOpen,
      togglePip,
    }),
    [
      playTrack, togglePlay, play, pause, next, previous, seek,
      currentTrack, isPlaying, currentTime, duration, playerError,
      queue, queueIndex, upcomingQueue, playFromQueue, volume, setVolume, toggleMute,
      shuffle, toggleShuffle, repeatMode, cycleRepeatMode,
      autoplay, toggleAutoplay, addToQueue,
      isExpanded, expand, collapse, toggleExpanded,
      pipSupport, pipWindow, videoPipOpen, togglePip,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
      {/* Toujours montés (même sans piste) pour ne jamais perdre l'état de lecture
          entre deux navigations de page côté client. Pas de prop `src` déclarative :
          elle est gérée entièrement de façon impérative par loadAndPlay/preloadOnIdle
          ci-dessus — sinon React la réassignerait à chaque re-render (même à une
          valeur identique), ce qui relance le chargement et coupe la lecture en cours. */}
      <audio ref={setAudioEl0} />
      <audio ref={setAudioEl1} />
      {/* Conteneurs SoundCloud/YouTube, jamais gérés par React lui-même (voir
          loadSoundCloudTrack/ensureYoutubePlayer) : l'audio doit continuer à
          streamer, seule l'apparence de leur lecteur est masquée au profit du
          lecteur flottant/panneau ci-dessous, piloté via leurs API JS. */}
      <div ref={scContainerRef} aria-hidden="true" className="fixed left-[-9999px] top-[-9999px]" />
      <div ref={ytContainerRef} aria-hidden="true" className="fixed left-[-9999px] top-[-9999px] h-[1px] w-[1px] overflow-hidden" />
      {/* Repli PiP vidéo (Safari) : canvas jamais affiché, sert uniquement de
          source à captureStream() ; la vidéo est cachée hors-écran (pas
          display:none, même raison que les conteneurs SC/YT ci-dessus — un
          flux vidéo peut se dégrader silencieusement dans un élément masqué
          par display:none) mais c'est SA fenêtre native de PiP qui est visible. */}
      <canvas ref={pipCanvasRef} width={320} height={320} hidden />
      <video ref={pipVideoRef} muted playsInline className="fixed left-[-9999px] top-[-9999px] h-px w-px" />
      {/* Fenêtre Document PiP : un vrai Window séparé, avec son propre
          document — createPortal y rend PipDocumentContent tout en le gardant
          dans CET arbre React, donc useAudioPlayer() y fonctionne normalement. */}
      {pipWindow && createPortal(<PipDocumentContent />, pipWindow.document.body)}
      <NowPlayingBar />
      <NowPlayingOverlay />
    </AudioPlayerContext.Provider>
  );
}
