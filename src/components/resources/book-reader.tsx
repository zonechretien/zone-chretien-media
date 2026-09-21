"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Mail, X } from "lucide-react";

const DEFAULT_FREE_PREVIEW_PAGES = 10;

type Status = "loading" | "ready" | "error" | "unsupported";

export function BookReader({
  fileUrl,
  title,
  coverImageUrl,
  freePreviewPages,
  detailHref,
  contactEmail,
}: {
  fileUrl: string;
  title: string;
  coverImageUrl: string | null;
  freePreviewPages: number | null;
  detailHref: string;
  contactEmail: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<import("pdfjs-dist").PDFDocumentLoadingTask | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [showEndMessage, setShowEndMessage] = useState(false);

  const maxPreviewPage = Math.max(
    1,
    Math.min(freePreviewPages ?? DEFAULT_FREE_PREVIEW_PAGES, totalPages || Infinity),
  );

  useEffect(() => {
    if (!fileUrl.toLowerCase().split("?")[0].endsWith(".pdf")) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const loadingTask = pdfjs.getDocument({ url: fileUrl });
        loadingTaskRef.current = loadingTask;
        const doc = await loadingTask.promise;
        if (cancelled) return;
        docRef.current = doc;
        setTotalPages(doc.numPages);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
      loadingTaskRef.current?.destroy();
    };
  }, [fileUrl]);

  useEffect(() => {
    if (status !== "ready" || showEndMessage) return;
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    let cancelled = false;

    async function render() {
      const pdfPage = await doc!.getPage(page);
      if (cancelled) return;

      const viewport = pdfPage.getViewport({ scale: 1.4 });
      const context = canvas!.getContext("2d");
      if (!context) return;
      canvas!.width = viewport.width;
      canvas!.height = viewport.height;
      // Le buffer canvas reste en pleine résolution (netteté) ; l'affichage
      // CSS est contraint séparément pour ne jamais déborder le conteneur.
      canvas!.style.width = "100%";
      canvas!.style.height = "auto";

      renderTaskRef.current?.cancel();
      const task = pdfPage.render({ canvasContext: context, viewport, canvas: canvas! });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch {
        // Rendu annulé par une navigation rapide — sans conséquence.
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [status, page, showEndMessage]);

  function goNext() {
    if (page < maxPreviewPage) setPage((p) => p + 1);
    else setShowEndMessage(true);
  }

  function goPrevious() {
    if (showEndMessage) {
      setShowEndMessage(false);
      return;
    }
    if (page > 1) setPage((p) => p - 1);
  }

  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl bg-brand-navy text-white">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <Link
          href={detailHref}
          aria-label="Retour à la fiche du livre"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <X size={16} />
        </Link>
        {coverImageUrl && (
          <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded">
            <Image src={coverImageUrl} alt="" fill unoptimized className="object-cover" sizes="32px" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{title}</p>
          <p className="text-xs text-white/50">Extrait gratuit</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-4 sm:p-8">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Chargement de l&apos;extrait…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex max-w-sm flex-col items-center gap-3 text-center text-white/70">
            <p className="font-body text-sm">
              L&apos;extrait n&apos;a pas pu être chargé pour le moment. Réessayez plus tard ou
              contactez-nous si le problème persiste.
            </p>
            <Link href={detailHref} className="text-sm font-semibold text-brand-gold hover:underline">
              Retour à la fiche du livre
            </Link>
          </div>
        )}

        {status === "unsupported" && (
          <div className="flex max-w-sm flex-col items-center gap-3 text-center text-white/70">
            <p className="font-body text-sm">
              Cet extrait n&apos;est pas disponible dans ce format pour le moment.
            </p>
            <Link href={detailHref} className="text-sm font-semibold text-brand-gold hover:underline">
              Retour à la fiche du livre
            </Link>
          </div>
        )}

        {status === "ready" && !showEndMessage && (
          <div className="w-full max-w-[700px]">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
            />
          </div>
        )}

        {status === "ready" && showEndMessage && (
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <p className="font-display text-xl font-bold">Fin de l&apos;extrait gratuit</p>
            <p className="font-body text-sm text-white/70">
              Vous avez atteint la fin des pages disponibles en aperçu. Contactez-nous pour obtenir
              le livre complet.
            </p>
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Livre complet : ${title}`)}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light px-6 py-3 font-body text-sm font-bold text-brand-navy transition hover:-translate-y-0.5"
            >
              <Mail size={16} />
              Nous contacter
            </a>
            <Link href={detailHref} className="text-sm text-white/50 hover:text-white">
              Retour à la fiche du livre
            </Link>
          </div>
        )}
      </div>

      {status === "ready" && (
        <footer className="flex items-center justify-center gap-6 border-t border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={goPrevious}
            disabled={page === 1 && !showEndMessage}
            aria-label="Page précédente"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-body text-sm text-white/70">
            {showEndMessage ? `Aperçu terminé` : `Page ${page} / ${maxPreviewPage} (aperçu)`}
          </span>
          <button
            type="button"
            onClick={goNext}
            aria-label="Page suivante"
            disabled={showEndMessage}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </footer>
      )}
    </div>
  );
}
