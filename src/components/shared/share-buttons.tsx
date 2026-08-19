"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FacebookIcon, WhatsappIcon, XIcon } from "@/components/icons/social-icons";

export function ShareButtons({
  url,
  title,
  className,
  compact = false,
}: {
  /** Chemin relatif (ex: "/chansons/mon-titre") ou URL absolue. */
  url: string;
  title: string;
  className?: string;
  /** Sans le libellé "Partager :" et avec des boutons plus petits, pour les espaces réduits (cards). */
  compact?: boolean;
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
      {!compact && <span className="text-sm font-medium text-muted">Partager :</span>}
      {links.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Partager sur ${label}`}
          className={cn(
            "flex items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-gold hover:text-gold",
            compact ? "h-7 w-7" : "h-9 w-9",
          )}
        >
          <Icon size={compact ? 13 : 16} />
        </a>
      ))}
    </div>
  );
}
