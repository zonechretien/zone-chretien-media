import { Mail } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/social-icons";
import { getWhatsappUrl, cn } from "@/lib/utils";

const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition";
const labeledBtn =
  "flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition";
const disabledClass = "cursor-not-allowed text-muted opacity-50";

export function ArtistContactActions({
  whatsappNumber,
  email,
  size = "sm",
}: {
  whatsappNumber: string | null;
  email: string | null;
  size?: "sm" | "md";
}) {
  const whatsappUrl = whatsappNumber ? getWhatsappUrl(whatsappNumber) : null;
  const mailUrl = email ? `mailto:${email}` : null;
  const btnClass = size === "sm" ? iconBtn : labeledBtn;
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div className="flex items-center gap-1.5">
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter via WhatsApp"
          className={cn(btnClass, "text-foreground/80 hover:border-green-500 hover:text-green-600")}
        >
          <WhatsappIcon size={iconSize} />
          {size === "md" && "WhatsApp"}
        </a>
      ) : (
        <span title="Aucun contact renseigné" className={cn(btnClass, disabledClass)}>
          <WhatsappIcon size={iconSize} />
          {size === "md" && "WhatsApp"}
        </span>
      )}

      {mailUrl ? (
        <a
          href={mailUrl}
          aria-label="Envoyer un email"
          className={cn(btnClass, "text-foreground/80 hover:border-gold hover:text-gold")}
        >
          <Mail size={iconSize} />
          {size === "md" && "Email"}
        </a>
      ) : (
        <span title="Aucun contact renseigné" className={cn(btnClass, disabledClass)}>
          <Mail size={iconSize} />
          {size === "md" && "Email"}
        </span>
      )}
    </div>
  );
}
