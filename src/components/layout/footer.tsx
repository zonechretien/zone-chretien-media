import Link from "next/link";
import { Mail, MessageCircle, Music4 } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons";

const FOOTER_COLUMNS = [
  {
    title: "Navigation",
    links: [
      { href: "/", label: "Accueil" },
      { href: "/chansons", label: "Chansons" },
      { href: "/playlists", label: "Playlists" },
      { href: "/artistes", label: "Artistes" },
      { href: "/videos", label: "Vidéos" },
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
      { href: "/inspirations", label: "Inspirations" },
    ],
  },
];

export async function Footer() {
  const settings = await prisma.settings.findUnique({ where: { id: "settings" } });

  const socials = [
    { href: settings?.facebookUrl, icon: FacebookIcon, label: "Facebook" },
    { href: settings?.youtubeUrl, icon: YoutubeIcon, label: "YouTube" },
    { href: settings?.instagramUrl, icon: InstagramIcon, label: "Instagram" },
    { href: settings?.tiktokUrl, icon: TiktokIcon, label: "TikTok" },
    {
      href: settings?.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}` : null,
      icon: WhatsappIcon,
      label: "WhatsApp",
    },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-white/[0.06] bg-brand-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 border-b border-white/[0.06] px-4 py-12 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="mb-4 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold text-brand-navy">
              <Music4 size={20} />
            </span>
            <span className="font-accent text-2xl tracking-wide text-white">
              {settings?.siteName ?? "Zone-Chrétien Media"}
            </span>
          </Link>
          <p className="mb-5 max-w-sm font-body text-[13.5px] leading-relaxed text-white/50">
            {settings?.siteDescription ??
              "La musique, l'inspiration et la Parole pour édifier les nations."}
          </p>
          {socials.length > 0 && (
            <div className="flex gap-2.5">
              {socials.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.08] text-white/50 transition hover:bg-brand-gold hover:text-brand-navy"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          )}
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-[18px] border-b border-white/[0.08] pb-2.5 font-body text-[13px] font-bold uppercase tracking-wide text-white">
              {col.title}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1.5 font-body text-[13px] text-white/50 transition hover:text-brand-gold"
                  >
                    <span className="opacity-0 transition group-hover:opacity-100">→</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {(settings?.contactEmail || settings?.whatsappNumber) && (
          <div>
            <h3 className="mb-[18px] border-b border-white/[0.08] pb-2.5 font-body text-[13px] font-bold uppercase tracking-wide text-white">
              Contact
            </h3>
            <div className="flex flex-col gap-3.5">
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="flex items-start gap-2.5 font-body text-[13px] text-white/50 transition hover:text-brand-gold"
                >
                  <Mail size={13} className="mt-0.5 shrink-0 text-brand-gold" />
                  {settings.contactEmail}
                </a>
              )}
              {settings?.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 font-body text-[13px] text-white/50 transition hover:text-brand-gold"
                >
                  <MessageCircle size={13} className="mt-0.5 shrink-0 text-brand-gold" />
                  {settings.whatsappNumber}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 font-body text-xs text-white/30 sm:flex-row sm:px-6 lg:px-8">
        <span>
          © {new Date().getFullYear()} {settings?.siteName ?? "Zone-Chrétien Media"}. Tous droits réservés.
        </span>
        <a href="/sitemap.xml" className="text-brand-gold transition hover:text-brand-gold-light">
          Sitemap
        </a>
      </div>
    </footer>
  );
}
