import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionLabel({
  icon: Icon,
  children,
  className,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-center gap-2.5", className)}>
      <span className="h-px flex-1 bg-brand-gray-light" />
      <span className="flex shrink-0 items-center gap-2 whitespace-nowrap font-body text-[11px] font-bold uppercase tracking-[0.15em] text-brand-gray-dark">
        {Icon && <Icon size={12} className="text-brand-blue dark:text-brand-text" />}
        {children}
      </span>
      <span className="h-px flex-1 bg-brand-gray-light" />
    </div>
  );
}
