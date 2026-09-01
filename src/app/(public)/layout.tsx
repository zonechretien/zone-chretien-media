import { Header } from "@/components/layout/header";
import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { VideoModalProvider } from "@/components/shared/video-modal-provider";
import { PdfModalProvider } from "@/components/shared/pdf-modal-provider";
import { AudioPlayerProvider } from "@/components/shared/audio-player-provider";
import { NewsletterPopup } from "@/components/shared/newsletter-popup";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioPlayerProvider>
      <VideoModalProvider>
        <PdfModalProvider>
          <TopBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <NewsletterPopup />
        </PdfModalProvider>
      </VideoModalProvider>
    </AudioPlayerProvider>
  );
}
