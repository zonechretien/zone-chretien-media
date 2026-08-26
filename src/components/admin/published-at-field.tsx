import type { UseFormRegisterReturn } from "react-hook-form";
import { inputClass } from "./form-fields";

export function PublishedAtField({ register }: { register: UseFormRegisterReturn }) {
  return (
    <div>
      <label htmlFor="publishedAt" className="mb-1.5 block text-sm font-medium text-foreground">
        Date de publication
      </label>
      <input id="publishedAt" type="date" className={`${inputClass} max-w-[200px]`} {...register} />
      <p className="mt-1 text-xs text-muted">
        Contrôle la date affichée publiquement — modifiez-la librement, elle ne suit plus la date de création.
      </p>
    </div>
  );
}
