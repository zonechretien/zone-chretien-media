import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VideoModalProvider } from "@/components/shared/video-modal-provider";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <VideoModalProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </VideoModalProvider>
  );
}
