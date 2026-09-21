// Chargement paresseux (une seule fois) de l'API IFrame YouTube — extrait de
// video-modal-provider.tsx pour être partagé avec le moteur de lecture audio
// de audio-player-provider.tsx (deux providers montés simultanément dans le
// layout public ; sans cette extraction, chacun installerait son propre
// `window.onYouTubeIframeAPIReady`, ce que le chaînage `previous?.()` rend
// sûr mais inutilement dupliqué).

export type YTPlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

export type YTPlayerCtor = new (
  target: HTMLElement,
  options: {
    videoId: string;
    host?: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: () => void;
      onStateChange?: (e: { data: number }) => void;
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

/**
 * Codes d'erreur du player YouTube indiquant que l'intégration a été désactivée par
 * l'ayant droit (label/Vevo notamment) — cas fréquent qu'on ne peut pas contourner.
 * Voir https://developers.google.com/youtube/iframe_api_reference#onError
 */
export const EMBED_RESTRICTED_ERROR_CODES = new Set([101, 150]);

let youtubeApiPromise: Promise<void> | null = null;

export function loadYoutubeIframeApi(): Promise<void> {
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
