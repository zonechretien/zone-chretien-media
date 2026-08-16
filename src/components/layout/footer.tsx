import Link from "next/link";
import { Music4 } from "lucide-react";
import { prisma } from "@/lib/db";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/icons/social-icons";

const FOOTER_COLUMNS = [
  {
    title: "Contenus",
    links: [
      { href: "/chansons", label: "Chansons" },
      { href: "/videos", label: "Vidéos" },
      { href: "/artistes", label: "Artistes" },
      { href: "/blog", label: "Blog chrétien" },
    ],
  },
  {
    title: "Édification",
    links: [
      { href: "/devotions", label: "Dévotions" },
      { href: "/prieres", label: "Prières" },
      { href: "/versets", label: "Verset du jour" },
      { href: "/temoignages", label: "Témoignages" },
    ],
  },
];

export async function Footer() {
  const settings = await prisma.settings.findUnique({ where: { id: "settings" } });

  const socials = [
    { href: settings?.facebookUrl, icon: FacebookIcon, label: "Facebook" },
    { href: settings?.instagramUrl, icon: InstagramIcon, label: "Instagram" },
    { href: settings?.youtubeUrl, icon: YoutubeIcon, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-border bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gold">
              <Music4 size={18} />
            </span>
            <span className="text-lg font-semibold">
              Zone-Chrétien <span className="text-gold">Media</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            {settings?.siteDescription ??
              "La musique, l'inspiration et la Parole pour édifier les nations."}
          </p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-gold hover:text-navy"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gold">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-white/50 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {settings?.siteName ?? "Zone-Chrétien Media"}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
