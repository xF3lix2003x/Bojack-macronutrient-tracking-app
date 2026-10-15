"use client";

import { useState } from "react";
import {
  Apple,
  BookmarkPlus,
  Check,
  ChevronDown,
  Coffee,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Utensils,
} from "lucide-react";
import type { MealEntry, MealType } from "@/lib/food/schemas";
import {
  computeMacrosForServing,
  formatServingLabel,
  sumMealEntryMacros,
} from "@/lib/food/nutrition";
import { useFoodStore } from "@/store/useFoodStore";
import { triggerHaptic } from "@/lib/mobileUtils";

interface MealListProps {
  entriesByMealType: Record<MealType, MealEntry[]>;
  yesterdayEntriesByMealType: Record<MealType, MealEntry[]>;
  onRemove: (id: string) => void;
  onEditEntry: (entry: MealEntry) => void;
  onRepeatYesterdayMeal: (mealType: MealType, entries: MealEntry[]) => void;
  onAddToMeal: (mealType: MealType) => void;
}

const MEAL_CONFIG: {
  key: MealType;
  label: string;
  emptyHint: string;
  icon: typeof Coffee;
  iconStyle: string;
}[] = [
  {
    key: "breakfast",
    label: "Colazione",
    emptyHint: "Inizia la giornata registrando la colazione",
    icon: Coffee,
    iconStyle: "bg-amber-500/12 border-amber-500/25 text-amber-400",
  },
  {
    key: "lunch",
    label: "Pranzo",
    emptyHint: "Tocca + per aggiungere il pranzo",
    icon: Utensils,
    iconStyle: "bg-emerald-500/12 border-emerald-500/25 text-emerald-400",
  },
  {
    key: "dinner",
    label: "Cena",
    emptyHint: "Tocca + per aggiungere la cena",
    icon: Moon,
    iconStyle: "bg-indigo-500/12 border-indigo-500/25 text-indigo-400",
  },
  {
    key: "snack",
    label: "Snack",
    emptyHint: "Spuntini, frutta o integratori",
    icon: Apple,
    iconStyle: "bg-rose-500/12 border-rose-500/25 text-rose-400",
  },
];

export function MealList({
  entriesByMealType,
  yesterdayEntriesByMealType,
  onRemove,
  onEditEntry,
  onRepeatYesterdayMeal,
  onAddToMeal,
}: MealListProps) {
  const createCustomFood = useFoodStore((state) => state.createCustomFood);
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>("breakfast");
  const [savingComboFor, setSavingComboFor] = useState<MealType | null>(null);
  const [comboName, setComboName] = useState("");
  const [savedSuccessMeal, setSavedSuccessMeal] = useState<MealType | null>(null);

  const toggleExpand = (meal: MealType) => {
    triggerHaptic("light");
    setExpandedMeal((prev) => (prev === meal ? null : meal));
  };

  const handleSaveMealCombo = async (mealKey: MealType, entries: MealEntry[]) => {
    if (entries.length === 0) return;
    const totals = sumMealEntryMacros(entries);
    const defaultTitle =
      comboName.trim() ||
      `Pasto: ${entries
        .slice(0, 2)
        .map((e) => e.foodItem.name)
        .join(" + ")}`;

    triggerHaptic("success");
    await createCustomFood({
      name: defaultTitle,
      brand: `Ricetta (${entries.length} ingredienti)`,
      servingUnit: "portion",
      servingAmount: 1,
      caloriesPer100g: Math.min(900, Math.round(totals.calories)),
      proteinPer100g: Math.min(100, Number(totals.protein.toFixed(1))),
      carbsPer100g: Math.min(100, Number(totals.carbs.toFixed(1))),
      fatPer100g: Math.min(100, Number(totals.fat.toFixed(1))),
    });

    setSavingComboFor(null);
    setComboName("");
    setSavedSuccessMeal(mealKey);
    setTimeout(() => setSavedSuccessMeal(null), 2500);
  };

  return (
    <div className="flex flex-col gap-3">
      {MEAL_CONFIG.map(({ key, label, emptyHint, icon: Icon, iconStyle }) => {
    	 const entries = entriesByMealType?.[key] ?? [];
	const yesterdayEntries = yesterdayEntriesByMealType?.[key] ?? [];
        const totals = sumMealEntryMacros(entries);
        const yesterdayTotals = sumMealEntryMacros(yesterdayEntries);
        const hasEntries = entries.length > 0;
        const canRepeatYesterday = !hasEntries && yesterdayEntries.length > 0;
        const isExpanded = expandedMeal === key;

        const summaryText = hasEntries
          ? entries.map((e) => e.foodItem.name).join(", ")
          : emptyHint;

        return (
          <div
            key={key}
            className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#12151E] transition hover:border-white/[0.12]"
          >
            <div className="flex items-center justify-between p-4">
              <button
                type="button"
                onClick={() => toggleExpand(key)}
                className="flex min-w-0 flex-1 items-center gap-3.5 pr-3 text-left"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${iconStyle}`}
                >
                  <Icon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{label}</h3>
                    {hasEntries && (
                      <span className="rounded-full bg-[#1A1E2B] px-2 py-0.5 text-[11px] font-semibold text-slate-400 tabular-nums">
                        {entries.length}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                    {summaryText}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={
                      hasEntries
                        ? "font-display text-sm font-bold text-white tabular-nums"
                        : "font-display text-sm font-bold text-slate-500 tabular-nums"
                    }
                  >
                    {Math.round(totals.calories)} kcal
                  </span>
                  <ChevronDown
                    size={16}
                    className={
                      isExpanded
                        ? "rotate-180 text-emerald-400 transition-transform duration-200"
                        : "text-slate-500 transition-transform duration-200"
                    }
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  onAddToMeal(key);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/12 text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950 active:scale-95"
                aria-label={`Aggiungi alimento a ${label}`}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>

            {canRepeatYesterday && (
              <div className="border-t border-white/[0.04] bg-[#0D1017]/70 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("success");
                    onRepeatYesterdayMeal(key, yesterdayEntries);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-left text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  <span className="inline-flex items-center gap-2 truncate pr-2">
                    <RotateCcw size={14} className="shrink-0 text-cyan-400" />
                    <span className="truncate">
                      Ripeti {label.toLowerCase()} di ieri (
                      {yesterdayEntries.map((e) => e.foodItem.name).join(", ")})
                    </span>
                  </span>
                  <span className="font-display shrink-0 font-bold text-white tabular-nums">
                    +{Math.round(yesterdayTotals.calories)} kcal
                  </span>
                </button>
              </div>
            )}

            {isExpanded && hasEntries && (
              <div className="border-t border-white/[0.05] bg-[#0D1017] px-4 py-3">
                <div className="flex flex-col gap-2">
                  {entries.map((entry) => {
                    const m = computeMacrosForServing(entry.foodItem, entry.loggedServing);
                    return (
                      <div
                        key={entry.id}
                        onClick={() => {
                          triggerHaptic("light");
                          onEditEntry(entry);
                        }}
                        className="group flex cursor-pointer items-center justify-between rounded-2xl border border-white/[0.05] bg-[#161A26] px-3.5 py-2.5 transition hover:border-emerald-500/40 hover:bg-[#1A1E2B]"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-white">
                              {entry.foodItem.name}
                            </p>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300 tabular-nums">
                              {formatServingLabel(entry.loggedServing)}
                              <Pencil size={10} className="opacity-70" />
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-400 tabular-nums">
                            <span className="font-bold text-white">
                              {Math.round(m.calories)} kcal
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                              {m.protein}g
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              {m.carbs}g
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              {m.fat}g
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic("medium");
                            onRemove(entry.id);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                          aria-label={`Rimuovi ${entry.foodItem.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Salva combinazione come Pasto / Ricetta Ricorrente */}
                  {entries.length >= 2 && (
                    <div className="mt-1 pt-1">
                      {savedSuccessMeal === key ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300">
                          <Check size={14} /> Salvato in &quot;I Miei Cibi&quot;!
                        </div>
                      ) : savingComboFor === key ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={comboName}
                            onChange={(e) => setComboName(e.target.value)}
                            placeholder={`Nome ricetta (es. ${label} Tipo)...`}
                            className="h-9 flex-1 rounded-xl border border-white/10 bg-[#161A26] px-3 text-xs text-white outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveMealCombo(key, entries)}
                            className="rounded-xl bg-emerald-500 px-3 text-xs font-extrabold text-slate-950"
                          >
                            Salva
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSavingComboFor(key)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2 text-xs font-semibold text-slate-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
                        >
                          <BookmarkPlus size={14} /> Salva questi {entries.length} cibi come Ricetta / Pasto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}