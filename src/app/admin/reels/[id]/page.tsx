import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ReelEditor } from "@/components/admin/reels/reel-editor";
import { TEMPLATE_METAS, isTemplateId, parseTemplateData } from "@reels/template-meta";

export const metadata: Metadata = { title: "Éditeur de Reel" };

export default async function EditReelPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const reel = await prisma.reelProject.findUnique({ where: { id } });
  if (!reel) notFound();

  if (!isTemplateId(reel.templateId)) {
    return <p className="text-red-500">Template « {reel.templateId} » inconnu : ce projet ne peut pas être ouvert.</p>;
  }

  // Données enregistrées illisibles ou devenues invalides (template modifié) :
  // on repart des valeurs par défaut plutôt que d'ouvrir un éditeur cassé.
  let data: Record<string, unknown>;
  let recovered = false;
  try {
    const parsed = parseTemplateData(reel.templateId, JSON.parse(reel.data));
    data = parsed.success ? (parsed.data as Record<string, unknown>) : (JSON.parse(reel.data) as Record<string, unknown>);
  } catch {
    data = TEMPLATE_METAS[reel.templateId].defaultProps("9:16") as Record<string, unknown>;
    recovered = true;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">« {reel.title} »</h1>
      {recovered && (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
          Les données enregistrées de ce projet étaient illisibles : valeurs par défaut du template chargées.
        </p>
      )}
      <ReelEditor
        reel={{
          id: reel.id,
          title: reel.title,
          templateId: reel.templateId,
          status: reel.status,
          data,
          lastExportPath: reel.lastExportPath,
          lastExportAt: reel.lastExportAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
