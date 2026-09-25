import type { z } from "zod";
import { BRAND } from "@reels/brand";
import type { FieldMeta } from "@reels/schemas";

/**
 * Transforme le schéma zod d'un template en description de formulaire.
 * Logique pure (testée) : le composant React ne fait qu'afficher ces champs.
 * Ajouter un champ dans un schéma de template suffit à le faire apparaître
 * dans l'éditeur, avec son libellé (.meta) et ses contraintes (min/max…).
 */

export type MediaKind = "image" | "video" | "audio";

export type FieldDesc =
  | {
      kind: "text";
      key: string;
      label: string;
      help?: string;
      placeholder?: string;
      maxLength?: number;
      multiline: boolean;
      optional: boolean;
      /** Référence biblique : nom du champ voisin qui reçoit le texte LSG 1910. */
      bibleTextField?: string;
      /** Saisie de date ou d'heure (champ texte au format AAAA-MM-JJ / HH:MM). */
      inputType?: "date" | "time";
    }
  | { kind: "boolean"; key: string; label: string; help?: string }
  | { kind: "number"; key: string; label: string; help?: string; min?: number; max?: number; step: number; nullable: boolean; slider: boolean }
  | { kind: "color"; key: string; label: string; help?: string }
  | {
      kind: "media";
      key: string;
      label: string;
      help?: string;
      mediaKind: MediaKind;
      /** Dossiers du disque proposés (par défaut selon le type de média). */
      folders?: string[];
      /** Voix off : propose aussi l'enregistrement au micro. */
      recordable: boolean;
    }
  | { kind: "enum"; key: string; label: string; help?: string; options: string[] }
  | { kind: "union"; key: string; label: string; help?: string; discriminator: string; options: UnionOption[] }
  /** Sous-objet (ex. musique) ; « nullable » = section facultative à activer. */
  | { kind: "group"; key: string; label: string; help?: string; nullable: boolean; fields: FieldDesc[]; defaults: Record<string, unknown> };

export type UnionOption = { value: string; label: string; fields: FieldDesc[]; defaults: Record<string, unknown> };

// Accès aux internes publics de zod 4 (def.type, shape, options, meta()).
type AnySchema = { def: { type: string; discriminator?: string } };
type Obj = AnySchema & { shape: Record<string, AnySchema> };

const asAny = (s: unknown) => s as AnySchema;
/** Métadonnées posées avec .meta() dans remotion/schemas.ts. */
const readMeta = (s: unknown) => (s as { meta: () => FieldMeta | undefined }).meta();

/** Retire les enveloppes nullable / default / optional (« .nullable().default(null) »). */
function unwrapNullable(s: AnySchema): { inner: AnySchema; nullable: boolean } {
  let inner = s;
  let nullable = false;
  while (["nullable", "default", "optional"].includes(inner.def.type)) {
    if (inner.def.type === "nullable") nullable = true;
    inner = asAny((inner as unknown as { unwrap: () => AnySchema }).unwrap());
  }
  return { inner, nullable };
}

/** Champs d'un objet zod ; `context.mediaKind` sert aux sous-objets d'une union (image / vidéo). */
export function describeObject(schema: z.ZodType, context: { mediaKind?: MediaKind; skip?: string[] } = {}): FieldDesc[] {
  const obj = schema as unknown as Obj;
  const fields: FieldDesc[] = [];
  for (const [key, raw] of Object.entries(obj.shape)) {
    if (context.skip?.includes(key)) continue;
    const field = describeField(key, asAny(raw), context);
    if (field) fields.push(field);
  }
  return fields;
}

function describeField(key: string, schema: AnySchema, context: { mediaKind?: MediaKind }): FieldDesc | null {
  const meta = readMeta(schema) ?? { label: key };
  if (meta.widget === "hidden" || meta.widget === "format") return null;
  const { inner, nullable } = unwrapNullable(schema);
  const base = { key, label: meta.label, help: meta.help };
  const t = inner.def.type;

  if (t === "literal") return null; // discriminant d'une union : géré par l'union
  if (meta.widget === "color") return { kind: "color", ...base };
  if (meta.widget === "media" || meta.widget === "voice") {
    return {
      kind: "media",
      ...base,
      mediaKind: meta.mediaKind ?? context.mediaKind ?? "image",
      folders: meta.folders,
      recordable: meta.widget === "voice",
    };
  }

  if (t === "string") {
    const s = inner as unknown as { maxLength: number | null; minLength: number | null };
    return {
      kind: "text",
      ...base,
      placeholder: meta.placeholder,
      maxLength: s.maxLength ?? undefined,
      multiline: meta.widget === "textarea",
      optional: !s.minLength,
      bibleTextField: meta.bible?.textField,
      inputType: meta.widget === "date" || meta.widget === "time" ? meta.widget : undefined,
    };
  }
  if (t === "boolean") return { kind: "boolean", ...base };
  if (t === "number") {
    const n = inner as unknown as { minValue: number | null; maxValue: number | null };
    return {
      kind: "number",
      ...base,
      min: Number.isFinite(n.minValue) ? (n.minValue as number) : undefined,
      max: Number.isFinite(n.maxValue) ? (n.maxValue as number) : undefined,
      step: meta.step ?? (meta.widget === "slider" ? 0.05 : 1),
      nullable,
      slider: meta.widget === "slider",
    };
  }
  if (t === "enum") return { kind: "enum", ...base, options: [...(inner as unknown as { options: string[] }).options] };
  if (t === "union" && inner.def.discriminator) {
    const discriminator = inner.def.discriminator;
    const options = (inner as unknown as { options: AnySchema[] }).options.map((option) => {
      const shape = (option as unknown as Obj).shape;
      const value = String((shape[discriminator] as unknown as { value: unknown }).value);
      const mediaKind: MediaKind | undefined = value === "image" || value === "video" || value === "audio" ? value : undefined;
      return {
        value,
        label: readMeta(option)?.label ?? value,
        fields: describeObject(option as unknown as z.ZodType, { mediaKind, skip: [discriminator] }),
        defaults: defaultsFor(option as unknown as z.ZodType),
      };
    });
    return { kind: "union", ...base, discriminator, options };
  }
  if (t === "object") {
    const obj = inner as unknown as z.ZodType;
    return { kind: "group", ...base, nullable, fields: describeObject(obj), defaults: defaultsFor(obj) };
  }
  return null;
}

/** Valeurs de départ d'un objet (utilisées quand on change de type de fond, par exemple). */
export function defaultsFor(schema: z.ZodType): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries((schema as unknown as Obj).shape)) {
    const s = asAny(raw);
    const meta = readMeta(s);
    const { inner, nullable } = unwrapNullable(s);
    const t = inner.def.type;
    if (meta?.defaultValue !== undefined) out[key] = meta.defaultValue;
    else if (nullable) out[key] = null;
    else if (t === "literal") out[key] = (inner as unknown as { value: unknown }).value;
    else if (meta?.widget === "color") out[key] = BRAND.colors.navy;
    else if (t === "string") out[key] = "";
    else if (t === "boolean") out[key] = false;
    else if (t === "number") {
      const n = inner as unknown as { minValue: number | null; maxValue: number | null };
      const min = Number.isFinite(n.minValue) ? (n.minValue as number) : 0;
      const max = Number.isFinite(n.maxValue) ? (n.maxValue as number) : min;
      out[key] = Math.round(((min + max) / 2) * 100) / 100;
    }
  }
  return out;
}

/** Erreurs de validation zod indexées par chemin (« background.path »). */
export function errorsByPath(error: z.ZodError | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error?.issues ?? []) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Copie de `obj` où la valeur au chemin `path` est remplacée (mise à jour immuable). */
export function setIn(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  if (path.length === 0) return obj;
  const [head, ...rest] = path;
  const child = obj[head];
  return {
    ...obj,
    [head]: rest.length === 0 ? value : setIn(child && typeof child === "object" ? (child as Record<string, unknown>) : {}, rest, value),
  };
}

/** Valeur au chemin `path` (undefined si absente). */
export function getIn(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}
