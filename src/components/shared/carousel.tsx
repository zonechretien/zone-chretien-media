"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Carousel({
  children,
  autoPlay = false,
  autoPlayInterval = 3500,
  showArrows = false,
  className,
}: {
  children: React.ReactNode;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showArrows?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const checkOverflow = () => setCanScroll(track.scrollWidth > track.clientWidth + 4);
    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(track);
    return () => observer.disconnect();
  }, [children]);

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 4;
    const atStart = scrollLeft <= 4;

    if (direction === 1 && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && atStart) {
      track.scrollTo({ left: scrollWidth, behavior: "smooth" });
      return;
    }
    track.scrollBy({ left: direction * clientWidth * 0.9, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const track = trackRef.current;
    if (!track) return;

    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", resume);

    const id = setInterval(() => {
      if (!paused) scrollByPage(1);
    }, autoPlayInterval);

    return () => {
      clearInterval(id);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("touchend", resume);
    };
  }, [autoPlay, autoPlayInterval, scrollByPage]);

  return (
    <div className={cn("group/carousel relative", className)}>
      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
      >
        {children}
      </div>
      {showArrows && canScroll && (
        <>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Précédent"
            className="absolute left-0 top-1/2 hidden -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface-elevated p-2 text-foreground shadow-lg transition hover:border-gold hover:text-gold sm:flex"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Suivant"
            className="absolute right-0 top-1/2 hidden translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface-elevated p-2 text-foreground shadow-lg transition hover:border-gold hover:text-gold sm:flex"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}

export function CarouselItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("shrink-0 snap-start", className)}>{children}</div>;
}
