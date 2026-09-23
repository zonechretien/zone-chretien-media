"use client";

import dynamic from "next/dynamic";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FORMATS, FORMAT_IDS, type FormatId } from "@reels/formats";
import type { VersetProps } from "@reels/schemas";
import { TEMPLATE_METAS, type TemplateId } from "@reels/template-meta";
import { FieldLabel, FormRow, inputClass, selectClass } from "@/components/admin/form-fields";
import { CancelLink } from "@/components/admin/submit-button";
import { saveReel } from "@/lib/actions/reels";
import { describeObject, errorsByPath, getIn, setIn } from "@/lib/reels/form-model";
import { STUDIO_MEDIA_URL, useStudioConnection } from "@/lib/reels/studio-client";
import { REEL_STATUS_LABELS } from "@/lib/validations/reels";
import { ExportPanel } from "./export-panel";
import { ReelFields, type FieldsContext } from "./reel-fields";
import { StudioStatus } from "./studio-status";

const ReelPreview = dynamic(() => import("./reel-preview"), {
  ssr: false,
  loading: () => <div className="aspect-[9/16] w-full animate-pulse rounded-xl bg-navy/80" />,
});

type Status = keyof typeof REEL_STATUS_LABELS;

export type EditableReel = {
  id: string;
  title: string;
  templateId: TemplateId;
  status: Status;
  data: Record<string, unknown>;
  lastExportPath: string | null;
  lastExportAt: string | null;
};

export function ReelEditor({ reel }: { reel: EditableReel }) {
  const meta = TEMPLATE_METAS[reel.templateId];
  const fields = useMemo(() => describeObject(meta.schema), [meta]);
  const { connection, refresh } = useStudioConnection();

  const [title, setTitle] = useState(reel.title);
  const [status, setStatus] = useState<Status>(reel.status);
  const [statusTouched, setStatusTouched] = useState(false);
  const [data, setData] = useState(reel.data);
  const [saved, setSaved] = useState(() => JSON.stringify({ title: reel.title, data: reel.data }));
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();

  // Référence toujours à jour, pour les réponses asynchrones (durée d'une vidéo…).
  const dataRef = useRef(data);
  dataRef.current = data;

  const validation = useMemo(() => meta.schema.safeParse(data), [meta, data]);
  const errors = useMemo(() => errorsByPath(validation.error), [validation]);
  // L'aperçu garde la dernière version valide pendant la saisie.
  const lastValid = useRef<VersetProps>(meta.defaultProps("9:16"));
  if (validation.success) lastValid.current = validation.data;

  const dirty = statusTouched || JSON.stringify({ title, data }) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = useCallback((path: string[], value: unknown) => setData((prev) => setIn(prev, path, value)), []);
  const ctx: FieldsContext = {
    get: (path) => getIn(dataRef.current, path),
    set,
    errors,
    studioOnline: connection.state === "online" && connection.status.disque.detecte,
  };

  const save = useCallback(async (): Promise<boolean> => {
    setMessage(null);
    const result = await saveReel(reel.id, { title, data, status: statusTouched && status !== "EXPORTED" ? status : undefined });
    if (result.error) {
      setMessage({ kind: "error", text: result.error });
      return false;
    }
    setSaved(JSON.stringify({ title, data }));
    setStatusTouched(false);
    setMessage({ kind: "ok", text: "Projet enregistré." });
    return true;
  }, [reel.id, title, data, status, statusTouched]);

  const format = (data.format as FormatId) ?? "9:16";
  const titleError = title.trim() ? null : "Le titre est obligatoire.";
  const mediaBaseUrl = connection.state === "online" ? STUDIO_MEDIA_URL : undefined;
  const usesDiskMedia = (() => {
    const bg = data.background as { type?: string } | undefined;
    return bg?.type === "image" || bg?.type === "video";
  })();

  return (
    <div>
      <div className="mb-6">
        <StudioStatus connection={connection} onRetry={refresh} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            startSaving(async () => void (await save()));
          }}
        >
          <FormRow>
            <FieldLabel htmlFor="reel-title" required>Titre du projet</FieldLabel>
            <input id="reel-title" className={inputClass} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
            {titleError && <p className="mt-1 text-sm text-red-500">{titleError}</p>}
          </FormRow>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormRow className="mb-0">
              <FieldLabel htmlFor="reel-format">Format</FieldLabel>
              <select id="reel-format" className={selectClass} value={format} onChange={(e) => set(["format"], e.target.value)}>
                {FORMAT_IDS.map((id) => (
                  <option key={id} value={id} disabled={!meta.formats.includes(id)}>
                    {FORMATS[id].label}
                    {meta.formats.includes(id) ? "" : " (bientôt)"}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow className="mb-0">
              <FieldLabel htmlFor="reel-status">Statut</FieldLabel>
              <select
                id="reel-status"
                className={selectClass}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as Status);
                  setStatusTouched(true);
                }}
              >
                <option value="DRAFT">{REEL_STATUS_LABELS.DRAFT}</option>
                <option value="READY">{REEL_STATUS_LABELS.READY}</option>
                <option value="EXPORTED" disabled>{REEL_STATUS_LABELS.EXPORTED} (après un export)</option>
              </select>
            </FormRow>
          </div>

          <p className="mb-6 mt-3 text-sm text-muted">
            Template : <span className="font-medium text-foreground">{meta.label}</span> — {meta.description}
          </p>

          <ReelFields fields={fields} ctx={ctx} />

          {message && (
            <p className={message.kind === "ok" ? "mb-4 text-sm text-emerald-600" : "mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500"}>
              {message.text}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <button
              type="submit"
              disabled={saving || !!titleError}
              className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Enregistrer
            </button>
            <CancelLink href="/admin/reels" />
            <span className="text-sm text-muted">{dirty ? "Modifications non enregistrées" : "Tout est enregistré"}</span>
          </div>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Aperçu</p>
            <button
              type="button"
              onClick={() => setShowSafeZones((v) => !v)}
              aria-pressed={showSafeZones}
              className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-gold"
            >
              {showSafeZones ? <EyeOff size={14} /> : <Eye size={14} />}
              {showSafeZones ? "Masquer les zones sûres" : "Afficher les zones sûres"}
            </button>
          </div>
          <ReelPreview templateId={reel.templateId} props={lastValid.current} mediaBaseUrl={mediaBaseUrl} showSafeZones={showSafeZones} />
          {showSafeZones && (
            <p className="mt-2 text-xs text-muted">Zones hachurées : recouvertes par l&apos;interface de Reels / TikTok / Shorts (jamais dans le MP4).</p>
          )}
          {usesDiskMedia && !mediaBaseUrl && (
            <p className="mt-2 text-xs text-amber-600">Média du disque indisponible sans le studio local : l&apos;aperçu affiche un dégradé à la place.</p>
          )}
          {!validation.success && (
            <p className="mt-2 text-xs text-amber-600">Aperçu figé sur la dernière version valide : corrigez les champs signalés.</p>
          )}

          <div className="mt-4">
            <ExportPanel
              reelId={reel.id}
              templateId={reel.templateId}
              title={title}
              connection={connection}
              blockedReason={!validation.success ? "Corrigez les champs signalés avant d'exporter." : titleError}
              prepare={async () => {
                if (!validation.success) return null;
                if (dirty && !(await save())) return null;
                return validation.data as Record<string, unknown>;
              }}
              onExported={() => {
                setStatus("EXPORTED");
                setStatusTouched(false);
              }}
              lastExport={reel.lastExportPath && reel.lastExportAt ? { path: reel.lastExportPath, at: reel.lastExportAt } : null}
            />
          </div>
        </aside>
      </div>

      <footer className="mt-12 border-t border-border pt-4 text-center text-xs text-muted">
        Éditeur de Reels Zone-Chrétien — Développé par Lepolo
      </footer>
    </div>
  );
}
