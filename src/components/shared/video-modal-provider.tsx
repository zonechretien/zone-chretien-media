"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { YoutubeIcon } from "@/components/icons/social-icons";

type VideoModalState = { embedUrl: string; title: string } | null;

const VideoModalContext = createContext<{ openVideo: (embedUrl: string, title: string) => void } | null>(
  null,
);

/** Ouvre la vidéo YouTube donnée (URL d'embed déjà résolue) dans la modale globale. */
export function useVideoModal() {
  const ctx = useContext(VideoModalContext);
  if (!ctx) throw new Error("useVideoModal doit être utilisé dans VideoModalProvider");
  return ctx;
}

function getVideoIdFromEmbedUrl(embedUrl: string): string | null {
  const match = embedUrl.match(/\/embed\/([\w-]{11})/);
  return match?.[1] ?? null;
}

// --- Chargement paresseux (une seule fois) de l'API IFrame YouTube -----------------------
type YTPlayerInstance = { destroy: () => void };
type YTPlayerCtor = new (
  target: HTMLElement,
  options: {
    videoId: string;
    host?: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: () => void;
      onError?: (e: { data: number }) => void;
    };
  },
) => YTPlayerInstance;

declare global {
  interface Window {
    YT?: { Player: YTPlayerCtor };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYoutubeIframeApi(): Promise<void> {
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

/**
 * Codes d'erreur du player YouTube indiquant que l'intégration a été désactivée par
 * l'ayant droit (label/Vevo notamment) — cas fréquent qu'on ne peut pas contourner,
 * seulement afficher proprement avec un lien de repli vers YouTube.
 * Voir https://developers.google.com/youtube/iframe_api_reference#onError
 */
const EMBED_RESTRICTED_ERROR_CODES = new Set([101, 150]);

function YoutubePlayer({
  videoId,
  title,
  onEmbedRestricted,
}: {
  videoId: string;
  title: string;
  onEmbedRestricted: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let player: YTPlayerInstance | null = null;
    let cancelled = false;
    // Le YT Player remplace l'élément cible par un <iframe> — on lui donne un div créé
    // hors JSX (jamais géré par React) pour que le démontage de React et celui du player
    // ne se marchent jamais dessus (sinon: "Failed to execute 'removeChild' on 'Node'").
    const mountPoint = document.createElement("div");
    mountPoint.className = "h-full w-full";

    loadYoutubeIframeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      containerRef.current.appendChild(mountPoint);
      player = new window.YT.Player(mountPoint, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 1 },
        events: {
          onError: (e) => {
            if (EMBED_RESTRICTED_ERROR_CODES.has(e.data)) onEmbedRestricted();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [videoId, onEmbedRestricted]);

  return <div ref={containerRef} className="h-full w-full" title={title} />;
}

function EmbedRestrictedFallback({ title, videoId }: { title: string; videoId: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-brand-navy px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
        <AlertTriangle size={22} />
      </span>
      <div>
        <p className="font-body text-sm font-semibold text-white">
          Cette vidéo ne peut pas être lue directement ici
        </p>
        <p className="mx-auto mt-1.5 max-w-sm font-body text-[13px] leading-relaxed text-white/60">
          L&apos;ayant droit (souvent un label ou une distribution Vevo) a désactivé la lecture
          intégrée pour « {title} ». Vous pouvez la regarder directement sur YouTube.
        </p>
      </div>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 font-body text-sm font-semibold text-white transition hover:bg-brand-red/85"
      >
        <YoutubeIcon size={16} />
        Regarder sur YouTube
      </a>
    </div>
  );
}

export function VideoModalProvider({ children }: { children: React.ReactNode }) {
  const [video, setVideo] = useState<VideoModalState>(null);
  const [embedRestricted, setEmbedRestricted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const openVideo = useCallback((embedUrl: string, title: string) => {
    setEmbedRestricted(false);
    setVideo({ embedUrl, title });
  }, []);
  const close = useCallback(() => setVideo(null), []);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [video, close]);

  const videoId = video ? getVideoIdFromEmbedUrl(video.embedUrl) : null;

  return (
    <VideoModalContext.Provider value={{ openVideo }}>
      {children}
      {mounted &&
        video &&
        videoId &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={video.title}
          >
            <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer la vidéo"
                className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X size={20} />
              </button>
              <div className="aspect-video max-h-[80vh] overflow-hidden rounded-2xl bg-black shadow-2xl">
                {embedRestricted ? (
                  <EmbedRestrictedFallback title={video.title} videoId={videoId} />
                ) : (
                  <YoutubePlayer
                    key={videoId}
                    videoId={videoId}
                    title={video.title}
                    onEmbedRestricted={() => setEmbedRestricted(true)}
                  />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </VideoModalContext.Provider>
  );
}
