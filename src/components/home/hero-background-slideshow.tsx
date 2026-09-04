"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type HeroPhoto = { id: string; name: string; imageUrl: string };

const INTERVAL_MS = 6000;

export function HeroBackgroundSlideshow({ photos }: { photos: HeroPhoto[] }) {
  const [index, setIndex] = useState(0);
  // Ne monte qu'une photo de plus à la fois, juste avant d'en avoir besoin pour la
  // transition suivante — évite de charger les 10 photos dès l'affichage initial
  // de la page d'accueil (la plus visitée du site).
  const [mounted, setMounted] = useState(Math.min(2, photos.length));

  useEffect(() => {
    if (photos.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
      setMounted((m) => Math.min(m + 1, photos.length));
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {photos.slice(0, mounted).map((photo, i) => (
        <Image
          key={photo.id}
          src={photo.imageUrl}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-[1800ms] ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
