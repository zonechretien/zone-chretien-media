"use client";

import { useEffect, useRef } from "react";
import type { UseFormSetValue, FieldValues, Path, PathValue } from "react-hook-form";
import { slugify } from "@/lib/utils";

/** Remplit automatiquement le champ slug à partir d'une valeur source (titre/nom), tant que l'utilisateur ne l'a pas modifié à la main. */
export function useSlugSync<T extends FieldValues>(
  sourceValue: string | undefined,
  setValue: UseFormSetValue<T>,
  isEditing = false,
) {
  const touchedRef = useRef(isEditing);

  useEffect(() => {
    if (touchedRef.current || !sourceValue) return;
    setValue("slug" as Path<T>, slugify(sourceValue) as PathValue<T, Path<T>>, {
      shouldValidate: false,
    });
  }, [sourceValue, setValue]);

  return {
    onSlugManualEdit: () => {
      touchedRef.current = true;
    },
  };
}
