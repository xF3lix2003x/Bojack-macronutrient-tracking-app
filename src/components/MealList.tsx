"use client";

import { ChevronRight } from "lucide-react";
import type { MealEntry, MealType } from "@/lib/food/schemas";
import { sumMealEntryMacros } from "@/lib/food/nutrition";

interface MealListProps {
  entriesByMealType: Record<MealType, MealEntry[]>;
  onRemove: (id: string) => void;
  onAddToMeal: (mealType: MealType) => void;
}

const ORDERED_MEALS: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Colazione" },
  { key: "lunch", label: "Pranzo" },
  { key: "dinner", label: "Cena" },
  { key: "snack", label: "Snack" },
];

export function MealList({ entriesByMealType, onAddToMeal }: MealListProps) {
  return (
    <div className="flex flex-col gap-3">
      {ORDERED_MEALS.map(({ key, label }) => {
        const entries = entriesByMealType[key] ?? [];
        const totals = sumMealEntryMacros(entries);
        const hasEntries = entries.length > 0;

        const itemsSummary = hasEntries
          ? entries.map((e) => e.foodItem.name).join(", ")
          : "Nessun alimento registrato";

        return (
          <button
            key={key}
            type="button"
            onClick={() => onAddToMeal(key)}
            className="group relative flex w-full items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 text-left transition hover:border-zinc-700 hover:bg-zinc-900/90"
          >
            <div className="flex min-w-0 flex-1 flex-col pr-4">
              <span className="text-base font-bold text-white">{label}</span>
              <p className="mt-0.5 truncate text-sm text-zinc-400">{itemsSummary}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-200 tabular-nums">
                {hasEntries ? `${Math.round(totals.calories)} kcal` : "0 kcal"}
              </span>
              <ChevronRight
                size={18}
                className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-400"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}