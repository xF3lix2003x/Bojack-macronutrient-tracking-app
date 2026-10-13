"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle } from "lucide-react";
import type { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { MacroBadge } from "@/components/ui/MacroBadge";
import { CreateCustomFoodInputSchema, type CreateCustomFoodInput } from "@/lib/food/schemas";
import { scaleMacrosToGrams } from "@/lib/food/nutrition";
import { useFoodStore } from "@/store/useFoodStore";
import type { FoodItem } from "@/lib/food/schemas";

type CustomFoodFormValues = z.input<typeof CreateCustomFoodInputSchema>;

interface CustomFoodCreatorModalProps {
  onClose: () => void;
  onCreated: (food: FoodItem) => void;
  initialBarcode?: string;
  initialName?: string;
}

const FORM_DEFAULTS: CreateCustomFoodInput = {
  name: "",
  brand: undefined,
  barcode: undefined,
  servingUnit: "g",
  servingAmount: 100,
  caloriesPer100g: 0,
  proteinPer100g: 0,
  carbsPer100g: 0,
  fatPer100g: 0,
};

export function CustomFoodCreatorModal({
  onClose,
  onCreated,
  initialBarcode,
  initialName,
}: CustomFoodCreatorModalProps) {
  const createCustomFood = useFoodStore((state) => state.createCustomFood);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomFoodFormValues>({
    resolver: zodResolver(CreateCustomFoodInputSchema),
    defaultValues: {
      ...FORM_DEFAULTS,
      barcode: initialBarcode,
      name: initialName ?? "",
    },
  });

  const watched = watch();

  const previewGrams = useMemo(() => {
    if (watched.servingUnit === "portion") return 100;
    return Number.isFinite(watched.servingAmount) ? watched.servingAmount : 0;
  }, [watched.servingUnit, watched.servingAmount]);

  const previewMacros = useMemo(
    () =>
      scaleMacrosToGrams(
        {
          calories: Number(watched.caloriesPer100g) || 0,
          protein: Number(watched.proteinPer100g) || 0,
          carbs: Number(watched.carbsPer100g) || 0,
          fat: Number(watched.fatPer100g) || 0,
        },
        previewGrams,
      ),
    [watched.caloriesPer100g, watched.proteinPer100g, watched.carbsPer100g, watched.fatPer100g, previewGrams],
  );

  const onSubmit = async (values: CustomFoodFormValues) => {
    setSubmitError(null);
    try {
      const input: CreateCustomFoodInput = CreateCustomFoodInputSchema.parse(values);
      const food = await createCustomFood(input);
      onCreated(food);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create custom food");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";
  const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500";
  const errorClass = "mt-1 text-xs text-rose-400";

  return (
    <Modal
      title="Create Custom Food"
      subtitle="Define nutrition values per 100g — we'll calculate the rest"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="name">
              Food name
            </label>
            <input id="name" className={inputClass} placeholder="e.g. Homemade Protein Pancakes" {...register("name")} />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="brand">
              Brand (optional)
            </label>
            <input id="brand" className={inputClass} placeholder="e.g. Home Kitchen" {...register("brand")} />
          </div>

          <div>
            <label className={labelClass} htmlFor="barcode">
              Barcode (optional)
            </label>
            <input id="barcode" className={inputClass} placeholder="e.g. 5901234123457" {...register("barcode")} />
            {errors.barcode && <p className={errorClass}>{errors.barcode.message}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="servingUnit">
              Serving unit
            </label>
            <select id="servingUnit" className={inputClass} {...register("servingUnit")}>
              <option value="g">Grams (g)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="portion">Portion</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="servingAmount">
              Default serving amount
            </label>
            <input
              id="servingAmount"
              type="number"
              step="0.1"
              className={inputClass}
              {...register("servingAmount", { valueAsNumber: true })}
            />
            {errors.servingAmount && <p className={errorClass}>{errors.servingAmount.message}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Nutrition per 100{watched.servingUnit === "ml" ? "ml" : "g"}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass} htmlFor="caloriesPer100g">
                Calories (kcal)
              </label>
              <input
                id="caloriesPer100g"
                type="number"
                step="1"
                className={inputClass}
                {...register("caloriesPer100g", { valueAsNumber: true })}
              />
              {errors.caloriesPer100g && <p className={errorClass}>{errors.caloriesPer100g.message}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="proteinPer100g">
                Protein (g)
              </label>
              <input
                id="proteinPer100g"
                type="number"
                step="0.1"
                className={inputClass}
                {...register("proteinPer100g", { valueAsNumber: true })}
              />
              {errors.proteinPer100g && <p className={errorClass}>{errors.proteinPer100g.message}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="carbsPer100g">
                Carbs (g)
              </label>
              <input
                id="carbsPer100g"
                type="number"
                step="0.1"
                className={inputClass}
                {...register("carbsPer100g", { valueAsNumber: true })}
              />
              {errors.carbsPer100g && <p className={errorClass}>{errors.carbsPer100g.message}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="fatPer100g">
                Fat (g)
              </label>
              <input
                id="fatPer100g"
                type="number"
                step="0.1"
                className={inputClass}
                {...register("fatPer100g", { valueAsNumber: true })}
              />
              {errors.fatPer100g && <p className={errorClass}>{errors.fatPer100g.message}</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-300">
            Preview for {previewGrams}
            {watched.servingUnit === "ml" ? "ml" : "g"} serving
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-300">
              {previewMacros.calories} kcal
            </span>
            <MacroBadge macro="protein" value={previewMacros.protein} />
            <MacroBadge macro="carbs" value={previewMacros.carbs} />
            <MacroBadge macro="fat" value={previewMacros.fat} />
          </div>
          {watched.servingUnit === "portion" && (
            <p className="mt-2 text-[11px] text-zinc-500">
              Portions are previewed as a 100g equivalent until logged.
            </p>
          )}
        </div>

        {submitError && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          Save Custom Food
        </button>
      </form>
    </Modal>
  );
}
