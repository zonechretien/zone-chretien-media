"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, FileWarning, Loader2, X } from "lucide-react";

type PdfModalState = {
  url: string;
  title: string;
  onDownload?: () => void;
  /** false si une vérification serveur a détecté que l'hôte bloque l'intégration
   * (X-Frame-Options/CSP, ex. GitHub) — évite d'attendre inutilement le minuteur
   * client, dont l'iframe déclenche "load" même quand l'affichage est refusé. */
  previewable: boolean;
} | null;

const PdfModalContext = createContext<{
  openPdf: (url: string, title: string, options?: { onDownload?: () => void; previewable?: boolean }) => void;
} | null>(null);

/** Ouvre un PDF (Livre/Étude biblique de la Bibliothèque) en aperçu dans la modale
 * globale, plutôt que de quitter le site vers l'URL externe. */
export function usePdfModal() {
  const ctx = useContext(PdfModalContext);
  if (!ctx) throw new Error("usePdfModal doit être utilisé dans PdfModalProvider");
  return ctx;
}

// Détecter de façon fiable qu'un <iframe> cross-origin n'a PAS réussi à afficher un PDF
// en ligne est impossible en JS (CORS empêche toute lecture du contenu). Le meilleur
// compromis, utilisé ici : si "load" ne s'est pas déclenché après ce délai, on affiche
// le message de repli — cas fréquent quand l'hébergeur force un téléchargement
// (Content-Disposition: attachment) au lieu d'un affichage en ligne.
const LOAD_TIMEOUT_MS = 4500;

function PdfUnavailable() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-navy px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
        <FileWarning size={22} />
      </span>
      <div>
        <p className="font-body text-sm font-semibold text-white">Aperçu non disponible</p>
        <p className="mx-auto mt-1.5 max-w-sm font-body text-[13px] leading-relaxed text-white/60">
          Certains navigateurs (notamment sur mobile) n&apos;affichent pas les PDF en aperçu
          intégré. Utilisez les boutons ci-dessus pour l&apos;ouvrir ou le télécharger.
        </p>
      </div>
    </div>
  );
}

function PdfFrame({ url, previewable }: { url: string; previewable: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!previewable) return;
    setLoaded(false);
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [url, previewable]);

  if (!previewable || (timedOut && !loaded)) {
    return <PdfUnavailable />;
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      )}
      <iframe
        key={url}
        src={url}
        title="Aperçu PDF"
        className="h-full w-full border-0 bg-white"
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

export function PdfModalProvider({ children }: { children: React.ReactNode }) {
  const [pdf, setPdf] = useState<PdfModalState>(null);
  const [mounted, setMounted] = useState(false);
  const downloadedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const openPdf = useCallback(
    (url: string, title: string, options?: { onDownload?: () => void; previewable?: boolean }) => {
      downloadedRef.current = false;
      setPdf({ url, title, onDownload: options?.onDownload, previewable: options?.previewable ?? true });
    },
    [],
  );
  const close = useCallback(() => setPdf(null), []);

  useEffect(() => {
    if (!pdf) return;
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
  }, [pdf, close]);

  function handleDownloadClick() {
    if (downloadedRef.current) return;
    downloadedRef.current = true;
    pdf?.onDownload?.();
  }

  return (
    <PdfModalContext.Provider value={{ openPdf }}>
      {children}
      {mounted &&
        pdf &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={pdf.title}
          >
            <div
              className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-navy shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-navy px-4 py-3 sm:px-5">
                <p className="truncate font-body text-sm font-semibold text-white">{pdf.title}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ouvrir dans un nouvel onglet"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-gold"
                  >
                    <ExternalLink size={17} />
                  </a>
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownloadClick}
                    aria-label="Télécharger"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-gold"
                  >
                    <Download size={17} />
                  </a>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Fermer l'aperçu"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>
              <div className="relative flex-1">
                <PdfFrame url={pdf.url} previewable={pdf.previewable} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </PdfModalContext.Provider>
  );
}
