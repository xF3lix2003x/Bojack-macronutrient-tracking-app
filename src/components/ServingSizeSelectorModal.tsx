"use client";

import { useMemo, useState } from "react";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { MacroBadge } from "@/components/ui/MacroBadge";
import type { FoodItem, MealType, ServingUnit } from "@/lib/food/schemas";
import { MEAL_TYPES } from "@/lib/food/schemas";
import { computeMacrosForServing, formatServingLabel } from "@/lib/food/nutrition";
import { MEAL_TYPE_LABELS } from "@/lib/food/theme";

interface ServingSizeSelectorModalProps {
  foodItem: FoodItem;
  initialMealType?: MealType;
  onClose: () => void;
  onConfirm: (payload: { servingUnit: ServingUnit; servingAmount: number; mealType: MealType }) => Promise<void>;
}

const QUICK_GRAM_PRESETS = [50, 100, 150, 200, 300];

export function ServingSizeSelectorModal({
  foodItem,
  initialMealType = "snack",
  onClose,
  onConfirm,
}: ServingSizeSelectorModalProps) {
  const [servingUnit, setServingUnit] = useState<ServingUnit>(foodItem.defaultServing.unit);
  const [servingAmount, setServingAmount] = useState<number>(foodItem.defaultServing.amount);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewMacros = useMemo(() => {
    if (!Number.isFinite(servingAmount) || servingAmount <= 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return computeMacrosForServing(foodItem, { unit: servingUnit, amount: servingAmount });
  }, [foodItem, servingUnit, servingAmount]);

  const handleConfirm = async () => {
    if (!Number.isFinite(servingAmount) || servingAmount <= 0) {
      setError("Enter a serving amount greater than zero");
      return;
    }
    setError(null);
    setIsConfirming(true);
    try {
      await onConfirm({ servingUnit, servingAmount, mealType });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log food");
    } finally {
      setIsConfirming(false);
    }
  };

  const unitButtonClass = (unit: ServingUnit) =>
    `flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
      servingUnit === unit
        ? "border-sky-500 bg-sky-500/15 text-sky-300"
        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
    }`;

  return (
    <Modal
      title={foodItem.name}
      subtitle={foodItem.brand ?? "Adjust the serving size before logging"}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-2">
          {(["g", "ml", "portion"] as ServingUnit[]).map((unit) => (
            <button key={unit} type="button" className={unitButtonClass(unit)} onClick={() => setServingUnit(unit)}>
              {unit === "portion" ? "Portion" : unit.toUpperCase()}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500" htmlFor="servingAmount">
            Amount {servingUnit !== "portion" && `(${servingUnit})`}
          </label>
          <input
            id="servingAmount"
            type="number"
            min={0}
            step={servingUnit === "portion" ? 0.5 : 1}
            value={Number.isFinite(servingAmount) ? servingAmount : ""}
            onChange={(event) => setServingAmount(event.target.valueAsNumber)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-center text-xl font-semibold text-zinc-50 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          />
        </div>

        {servingUnit !== "portion" && (
          <div className="flex flex-wrap gap-2">
            {QUICK_GRAM_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setServingAmount(preset)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  servingAmount === preset
                    ? "border-sky-500 bg-sky-500/15 text-sky-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {preset}
                {servingUnit}
              </button>
            ))}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">Meal</p>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize transition ${
                  mealType === type
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {formatServingLabel({ unit: servingUnit, amount: servingAmount || 0 })} of {foodItem.name}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-300">
              {previewMacros.calories} kcal
            </span>
            <MacroBadge macro="protein" value={previewMacros.protein} />
            <MacroBadge macro="carbs" value={previewMacros.carbs} />
            <MacroBadge macro="fat" value={previewMacros.fat} />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConfirming ? <Loader2 size={18} className="animate-spin" /> : <UtensilsCrossed size={18} />}
          Log {MEAL_TYPE_LABELS[mealType]}
        </button>
      </div>
    </Modal>
  );
}
