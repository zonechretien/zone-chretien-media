"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FacebookIcon, WhatsappIcon, XIcon } from "@/components/icons/social-icons";

export function ShareButtons({
  url,
  title,
  className,
  compact = false,
  dark = false,
}: {
  /** Chemin relatif (ex: "/chansons/mon-titre") ou URL absolue. */
  url: string;
  title: string;
  className?: string;
  /** Sans le libellé "Partager :" et avec des boutons plus petits, pour les espaces réduits (cards). */
  compact?: boolean;
  /** À utiliser quand le composant est posé sur un fond sombre (ex. carte navy),
   * indépendamment du thème clair/sombre du site — sinon le texte foncé par défaut
   * devient illisible sur ce fond. */
  dark?: boolean;
}) {
  // Le rendu initial (SSR + premier rendu client) doit être identique pour
  // éviter une erreur d'hydratation : on part de `url` tel quel, et on ne
  // résout l'origine qu'après montage, une fois `window` disponible.
  const [absoluteUrl, setAbsoluteUrl] = useState(url);
  useEffect(() => {
    if (url.startsWith("/")) setAbsoluteUrl(`${window.location.origin}${url}`);
  }, [url]);

  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "WhatsApp",
      icon: WhatsappIcon,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "Facebook",
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "X",
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact && (
        <span className={cn("text-sm font-medium", dark ? "text-white/70" : "text-muted")}>Partager :</span>
      )}
      {links.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Partager sur ${label}`}
          className={cn(
            "flex items-center justify-center rounded-full border transition",
            dark
              ? "border-white/25 text-white/80 hover:border-gold-soft hover:text-gold-soft"
              : "border-border text-foreground/70 hover:border-navy hover:text-navy dark:hover:border-gold-soft dark:hover:text-gold-soft",
            compact ? "h-7 w-7" : "h-9 w-9",
          )}
        >
          <Icon size={compact ? 13 : 16} />
        </a>
      ))}
    </div>
  );
}
