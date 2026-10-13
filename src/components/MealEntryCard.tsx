"use client";

import { Trash2 } from "lucide-react";
import type { MealEntry } from "@/lib/food/schemas";
import { computeMacrosForServing, formatServingLabel } from "@/lib/food/nutrition";
import { MacroBadge } from "@/components/ui/MacroBadge";

interface MealEntryCardProps {
  entry: MealEntry;
  onRemove: (id: string) => void;
}

export function MealEntryCard({ entry, onRemove }: MealEntryCardProps) {
  const macros = computeMacrosForServing(entry.foodItem, entry.loggedServing);
  const time = new Date(entry.loggedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition hover:border-zinc-700">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-100">{entry.foodItem.name}</p>
          {entry.foodItem.isCustom && (
            <span className="shrink-0 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              Custom
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {formatServingLabel(entry.loggedServing)} · {time}
          {entry.foodItem.brand ? ` · ${entry.foodItem.brand}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300">
            {macros.calories} kcal
          </span>
          <MacroBadge macro="protein" value={macros.protein} compact />
          <MacroBadge macro="carbs" value={macros.carbs} compact />
          <MacroBadge macro="fat" value={macros.fat} compact />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        className="shrink-0 rounded-full p-2 text-zinc-600 transition hover:bg-rose-500/10 hover:text-rose-400"
        aria-label={`Remove ${entry.foodItem.name}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
