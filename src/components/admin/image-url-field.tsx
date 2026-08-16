"use client";

import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { ImageOff } from "lucide-react";
import { inputClass } from "./form-fields";

export function ImageUrlField({
  register,
  defaultValue,
  placeholder = "https://…",
}: {
  register: UseFormRegisterReturn;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [preview, setPreview] = useState(defaultValue ?? "");

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <input
          type="url"
          placeholder={placeholder}
          className={inputClass}
          defaultValue={defaultValue}
          {...register}
          onChange={(e) => {
            register.onChange(e);
            setPreview(e.target.value);
          }}
        />
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <ImageOff size={16} className="text-muted" />
        )}
      </div>
    </div>
  );
}
