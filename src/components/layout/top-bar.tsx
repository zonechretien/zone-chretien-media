import { Music4 } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons";

export async function TopBar() {
  const settings = await prisma.settings.findUnique({ where: { id: "settings" } });

  const socials = [
    { href: settings?.facebookUrl, icon: FacebookIcon, label: "Facebook" },
    { href: settings?.instagramUrl, icon: InstagramIcon, label: "Instagram" },
    { href: settings?.youtubeUrl, icon: YoutubeIcon, label: "YouTube" },
    { href: settings?.tiktokUrl, icon: TiktokIcon, label: "TikTok" },
    {
      href: settings?.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}` : null,
      icon: WhatsappIcon,
      label: "WhatsApp",
    },
  ].filter((s) => s.href);

  return (
    <div className="hidden bg-brand-navy py-2 sm:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 text-xs text-brand-gray sm:px-6 lg:px-8">
        <span className="flex items-center gap-1.5">
          <Music4 size={11} className="text-brand-gold" />
          {settings?.siteDescription ?? "La musique, l'inspiration et la Parole pour édifier les nations."}
        </span>
        {socials.length > 0 && (
          <div className="flex items-center gap-2.5">
            {socials.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-brand-gray transition hover:bg-brand-gold hover:text-brand-navy"
              >
                <Icon size={11} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
