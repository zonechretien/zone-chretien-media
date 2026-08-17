"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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

export function VideoModalProvider({ children }: { children: React.ReactNode }) {
  const [video, setVideo] = useState<VideoModalState>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const openVideo = useCallback((embedUrl: string, title: string) => setVideo({ embedUrl, title }), []);
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

  return (
    <VideoModalContext.Provider value={{ openVideo }}>
      {children}
      {mounted &&
        video &&
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
                {/* key force le remontage de l'iframe à chaque nouvelle vidéo, et son démontage
                    à la fermeture est ce qui coupe réellement le son (contrairement à un simple
                    display:none, YouTube continue de jouer en arrière-plan sinon). */}
                <iframe
                  key={video.embedUrl}
                  src={`${video.embedUrl}?autoplay=1`}
                  title={video.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </VideoModalContext.Provider>
  );
}
