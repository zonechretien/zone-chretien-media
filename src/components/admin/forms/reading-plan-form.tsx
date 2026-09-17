"use client";

import { useState, useTransition } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import type { ReadingPlan, ReadingPlanDay, ReadingPlanPassage } from "@prisma/client";
import { readingPlanSchema, type ReadingPlanInput } from "@/lib/validations/reading-plans";
import { createReadingPlanAction, updateReadingPlanAction } from "@/lib/actions/reading-plans";
import { useSlugSync } from "@/lib/admin/use-slug-sync";
import {
  FieldError,
  FieldLabel,
  FormActions,
  FormGrid,
  FormRow,
  checkboxClass,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { ImageUrlField } from "@/components/admin/image-url-field";
import { SubmitButton, CancelLink } from "@/components/admin/submit-button";

export type PickableBook = { slug: string; name: string; chapterCount: number };
type PlanWithDays = ReadingPlan & { days: (ReadingPlanDay & { passages: ReadingPlanPassage[] })[] };

export function ReadingPlanForm({ plan, books }: { plan?: PlanWithDays; books: PickableBook[] }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const methods = useForm<ReadingPlanInput>({
    resolver: zodResolver(readingPlanSchema),
    defaultValues: plan
      ? {
          title: plan.title,
          slug: plan.slug,
          description: plan.description ?? "",
          durationDays: plan.durationDays,
          coverImageUrl: plan.coverImageUrl ?? "",
          metaTitle: plan.metaTitle ?? "",
          metaDescription: plan.metaDescription ?? "",
          published: plan.published,
          days: [...plan.days]
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((d) => ({
              dayNumber: d.dayNumber,
              passages: [...d.passages]
                .sort((a, b) => a.position - b.position)
                .map((p) => ({
                  bookSlug: p.bookSlug,
                  bookName: p.bookName,
                  chapterStart: p.chapterStart,
                  chapterEnd: p.chapterEnd,
                })),
            })),
        }
      : {
          published: false,
          durationDays: 1,
          days: [{ dayNumber: 1, passages: [] }],
        },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const { onSlugManualEdit } = useSlugSync(watch("title"), setValue, !!plan);
  const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({ control, name: "days" });

  function onSubmit(data: ReadingPlanInput) {
    setServerError(null);
    startTransition(async () => {
      const result = plan
        ? await updateReadingPlanAction(plan.id, data)
        : await createReadingPlanAction(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormGrid>
          <FormRow>
            <FieldLabel htmlFor="title" required>Titre</FieldLabel>
            <input id="title" className={inputClass} {...register("title")} />
            <FieldError error={errors.title} />
          </FormRow>
          <FormRow>
            <FieldLabel htmlFor="slug" required>Slug</FieldLabel>
            <input id="slug" className={inputClass} {...register("slug", { onChange: onSlugManualEdit })} />
            <FieldError error={errors.slug} />
          </FormRow>
        </FormGrid>

        <FormRow>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <textarea
            id="description"
            className={textareaClass}
            placeholder="Courte description affichée sur la page du plan…"
            {...register("description")}
          />
        </FormRow>

        <FormGrid>
          <FormRow>
            <FieldLabel htmlFor="durationDays" required>Durée (jours)</FieldLabel>
            <input
              id="durationDays"
              type="number"
              className={`${inputClass} max-w-[160px]`}
              {...register("durationDays", { valueAsNumber: true })}
            />
            <FieldError error={errors.durationDays} />
          </FormRow>
          <FormRow>
            <FieldLabel htmlFor="coverImageUrl">Image de couverture (URL)</FieldLabel>
            <ImageUrlField register={register("coverImageUrl")} defaultValue={plan?.coverImageUrl ?? undefined} />
            <FieldError error={errors.coverImageUrl} />
          </FormRow>
        </FormGrid>

        <FormRow>
          <p className="mb-1.5 block text-sm font-medium text-foreground">
            Jours du plan<span className="ml-0.5 text-red-500">*</span>
          </p>
          {errors.days?.message && <p className="mb-2 text-sm text-red-500">{errors.days.message}</p>}
          <div className="space-y-3">
            {dayFields.map((dayField, dayIndex) => (
              <ReadingPlanDayRow
                key={dayField.id}
                dayIndex={dayIndex}
                books={books}
                onRemoveDay={() => removeDay(dayIndex)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendDay({ dayNumber: dayFields.length + 1, passages: [] })}
            className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-gold hover:text-gold"
          >
            <Plus size={15} /> Ajouter un jour
          </button>
        </FormRow>

        <FormGrid>
          <FormRow>
            <FieldLabel htmlFor="metaTitle">Meta title (SEO)</FieldLabel>
            <input id="metaTitle" className={inputClass} {...register("metaTitle")} />
          </FormRow>
          <FormRow>
            <FieldLabel htmlFor="metaDescription">Meta description (SEO)</FieldLabel>
            <input id="metaDescription" className={inputClass} {...register("metaDescription")} />
          </FormRow>
        </FormGrid>

        <FormRow>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className={checkboxClass} {...register("published")} /> Publié
          </label>
        </FormRow>

        {serverError && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{serverError}</p>
        )}

        <FormActions>
          <SubmitButton pending={pending} />
          <CancelLink href="/admin/plans-lecture" />
        </FormActions>
      </form>
    </FormProvider>
  );
}

function ReadingPlanDayRow({
  dayIndex,
  books,
  onRemoveDay,
}: {
  dayIndex: number;
  books: PickableBook[];
  onRemoveDay: () => void;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ReadingPlanInput>();
  const {
    fields: passageFields,
    append: appendPassage,
    remove: removePassage,
  } = useFieldArray({ control, name: `days.${dayIndex}.passages` });

  const dayErrors = errors.days?.[dayIndex];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <FormRow className="mb-0 max-w-[120px]">
          <FieldLabel htmlFor={`days.${dayIndex}.dayNumber`} required>Jour</FieldLabel>
          <input
            id={`days.${dayIndex}.dayNumber`}
            type="number"
            className={inputClass}
            {...register(`days.${dayIndex}.dayNumber`, { valueAsNumber: true })}
          />
        </FormRow>
        <button
          type="button"
          onClick={onRemoveDay}
          className="mb-2.5 text-red-500 transition hover:text-red-600"
          aria-label="Supprimer ce jour"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {dayErrors?.dayNumber?.message && (
        <p className="mb-2 text-sm text-red-500">{dayErrors.dayNumber.message}</p>
      )}

      <div className="space-y-2">
        {passageFields.map((passageField, passageIndex) => (
          <ReadingPlanPassageRow
            key={passageField.id}
            books={books}
            dayIndex={dayIndex}
            passageIndex={passageIndex}
            onRemove={() => removePassage(passageIndex)}
          />
        ))}
      </div>
      {dayErrors?.passages?.message && (
        <p className="mt-2 text-sm text-red-500">{dayErrors.passages.message}</p>
      )}

      <button
        type="button"
        onClick={() => appendPassage({ bookSlug: "", bookName: "", chapterStart: 1, chapterEnd: 1 })}
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
      >
        <Plus size={13} /> Ajouter un passage
      </button>
    </div>
  );
}

function ReadingPlanPassageRow({
  books,
  dayIndex,
  passageIndex,
  onRemove,
}: {
  books: PickableBook[];
  dayIndex: number;
  passageIndex: number;
  onRemove: () => void;
}) {
  const { register, control, setValue } = useFormContext<ReadingPlanInput>();
  const bookSlug = useWatch({ control, name: `days.${dayIndex}.passages.${passageIndex}.bookSlug` });
  const selectedBook = books.find((b) => b.slug === bookSlug);

  function handleBookChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const book = books.find((b) => b.slug === e.target.value);
    setValue(`days.${dayIndex}.passages.${passageIndex}.bookName`, book?.name ?? "");
    setValue(`days.${dayIndex}.passages.${passageIndex}.chapterStart`, 1);
    setValue(`days.${dayIndex}.passages.${passageIndex}.chapterEnd`, 1);
  }

  const chapterOptions = selectedBook
    ? Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1)
    : [];

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 rounded-lg border border-border/60 bg-surface-elevated p-2.5">
      <select
        className={selectClass}
        {...register(`days.${dayIndex}.passages.${passageIndex}.bookSlug`, { onChange: handleBookChange })}
      >
        <option value="">Livre…</option>
        {books.map((b) => (
          <option key={b.slug} value={b.slug}>{b.name}</option>
        ))}
      </select>

      <select
        className={`${selectClass} w-20`}
        disabled={!selectedBook}
        {...register(`days.${dayIndex}.passages.${passageIndex}.chapterStart`, { valueAsNumber: true })}
      >
        {chapterOptions.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      <span className="text-xs text-muted">à</span>

      <select
        className={`${selectClass} w-20`}
        disabled={!selectedBook}
        {...register(`days.${dayIndex}.passages.${passageIndex}.chapterEnd`, { valueAsNumber: true })}
      >
        {chapterOptions.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={onRemove}
        className="text-red-500 transition hover:text-red-600"
        aria-label="Retirer ce passage"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
