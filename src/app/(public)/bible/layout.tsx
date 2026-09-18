import { BibleSidebar, BibleSidebarMobile } from "@/components/bible/bible-sidebar";

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8 lg:px-8">
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <BibleSidebar />
      </aside>
      <BibleSidebarMobile />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
