"use client";

import { FieldLabel, FormRow, checkboxClass, inputClass, selectClass, textareaClass } from "@/components/admin/form-fields";
import type { FieldDesc } from "@/lib/reels/form-model";
import { studio } from "@/lib/reels/studio-client";
import { BibleInsert } from "./bible-insert";
import { MediaPicker } from "./media-picker";

type Path = string[];

export type FieldsContext = {
  get: (path: Path) => unknown;
  set: (path: Path, value: unknown) => void;
  errors: Record<string, string>;
  studioOnline: boolean;
};

/** Formulaire généré depuis la description du schéma zod du template. */
export function ReelFields({ fields, ctx, prefix = [] }: { fields: FieldDesc[]; ctx: FieldsContext; prefix?: Path }) {
  return (
    <>
      {fields.map((field) => (
        <Field key={field.key} field={field} siblings={fields} ctx={ctx} path={[...prefix, field.key]} />
      ))}
    </>
  );
}

function Help({ text }: { text?: string }) {
  return text ? <p className="mt-1 text-xs text-muted">{text}</p> : null;
}

function Error({ ctx, path }: { ctx: FieldsContext; path: Path }) {
  const message = ctx.errors[path.join(".")];
  return message ? <p className="mt-1 text-sm text-red-500">{message}</p> : null;
}

function Field({ field, siblings, ctx, path }: { field: FieldDesc; siblings: FieldDesc[]; ctx: FieldsContext; path: Path }) {
  const id = `reel-${path.join("-")}`;
  const value = ctx.get(path);

  switch (field.kind) {
    case "text": {
      const text = typeof value === "string" ? value : "";
      const Input = field.multiline ? "textarea" : "input";
      return (
        <FormRow>
          <FieldLabel htmlFor={id} required={!field.optional}>{field.label}</FieldLabel>
          <Input
            id={id}
            className={field.multiline ? textareaClass : inputClass}
            rows={field.multiline ? 6 : undefined}
            value={text}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            onChange={(e) => ctx.set(path, e.target.value)}
          />
          {field.maxLength && field.maxLength > 60 && (
            <p className="mt-1 text-right text-xs text-muted">{text.length} / {field.maxLength}</p>
          )}
          <Help text={field.help} />
          <Error ctx={ctx} path={path} />
          {field.bibleTextField && (
            <BibleInsert
              reference={text}
              maxTextLength={(() => {
                const target = siblings.find((s) => s.key === field.bibleTextField);
                return target?.kind === "text" ? target.maxLength : undefined;
              })()}
              onInsert={(reference, passage) => {
                ctx.set(path, reference);
                ctx.set([...path.slice(0, -1), field.bibleTextField!], passage);
              }}
            />
          )}
        </FormRow>
      );
    }

    case "boolean":
      return (
        <FormRow>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className={checkboxClass} checked={value === true} onChange={(e) => ctx.set(path, e.target.checked)} />
            {field.label}
          </label>
          <Help text={field.help} />
        </FormRow>
      );

    case "number": {
      const n = typeof value === "number" ? value : null;
      if (field.slider) {
        return (
          <FormRow>
            <FieldLabel htmlFor={id}>{field.label} : {Math.round((n ?? 0) * 100)} %</FieldLabel>
            <input
              id={id}
              type="range"
              className="w-full accent-[var(--gold)]"
              min={field.min ?? 0}
              max={field.max ?? 1}
              step={0.05}
              value={n ?? field.min ?? 0}
              onChange={(e) => ctx.set(path, Number(e.target.value))}
            />
            <Help text={field.help} />
            <Error ctx={ctx} path={path} />
          </FormRow>
        );
      }
      return (
        <FormRow>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <input
            id={id}
            type="number"
            className={inputClass}
            min={field.min}
            max={field.max}
            step={1}
            placeholder={field.nullable ? "Automatique" : undefined}
            value={n ?? ""}
            onChange={(e) => ctx.set(path, e.target.value === "" ? (field.nullable ? null : 0) : Number(e.target.value))}
          />
          <Help text={field.help} />
          <Error ctx={ctx} path={path} />
        </FormRow>
      );
    }

    case "color": {
      const color = typeof value === "string" ? value : "#000000";
      return (
        <FormRow>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <div className="flex items-center gap-2">
            <input id={id} type="color" className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent" value={color} onChange={(e) => ctx.set(path, e.target.value.toUpperCase())} />
            <input className={`${inputClass} max-w-[9rem] font-mono`} value={color} maxLength={7} aria-label={`${field.label} (code)`} onChange={(e) => ctx.set(path, e.target.value)} />
          </div>
          <Error ctx={ctx} path={path} />
        </FormRow>
      );
    }

    case "media":
      return (
        <FormRow>
          <FieldLabel htmlFor={id} required>{field.label}</FieldLabel>
          <MediaPicker
            kind={field.mediaKind}
            value={typeof value === "string" ? value : ""}
            online={ctx.studioOnline}
            onChange={(chemin) => {
              ctx.set(path, chemin);
              // Vidéo : sa durée permet de la faire boucler si elle est plus courte que le Reel.
              if (field.mediaKind === "video") {
                const durationPath = [...path.slice(0, -1), "mediaDurationSeconds"];
                ctx.set(durationPath, null);
                studio
                  .mediaInfo(chemin)
                  // Ignoré si un autre média a été choisi entre-temps.
                  .then((info) => ctx.get(path) === chemin && ctx.set(durationPath, info.dureeSecondes))
                  .catch(() => undefined);
              }
            }}
          />
          <Help text={field.help} />
          <Error ctx={ctx} path={path} />
        </FormRow>
      );

    case "enum":
      return (
        <FormRow>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          <select id={id} className={selectClass} value={String(value ?? "")} onChange={(e) => ctx.set(path, e.target.value)}>
            {field.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </FormRow>
      );

    case "union": {
      const current = (value ?? {}) as Record<string, unknown>;
      const selected = field.options.find((o) => o.value === current[field.discriminator]) ?? field.options[0];
      return (
        <fieldset className="mb-5 rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-medium text-foreground">{field.label}</legend>
          <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label={field.label}>
            {field.options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={o.value === selected.value}
                onClick={() => o.value !== selected.value && ctx.set(path, { ...o.defaults })}
                className={
                  o.value === selected.value
                    ? "rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-gold hover:text-gold"
                }
              >
                {o.label}
              </button>
            ))}
          </div>
          <ReelFields fields={selected.fields} ctx={ctx} prefix={path} />
        </fieldset>
      );
    }
  }
}
