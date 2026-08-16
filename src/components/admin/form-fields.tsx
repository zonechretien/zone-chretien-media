import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export function FieldError({ error }: { error?: FieldError }) {
  if (!error) return null;
  return <p className="mt-1 text-sm text-red-500">{error.message}</p>;
}

export const inputClass =
  "w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/40";

export const textareaClass = cn(inputClass, "min-h-[110px] resize-y");

export const selectClass = cn(inputClass, "appearance-none");

export const checkboxClass =
  "h-4 w-4 rounded border-border text-gold focus:ring-gold/40";

export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-5", className)}>{children}</div>;
}

export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 sm:grid-cols-2", className)}>{children}</div>;
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">{children}</div>;
}
