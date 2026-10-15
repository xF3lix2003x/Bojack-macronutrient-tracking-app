"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  MealEntry,
  DailyTarget,
  Macros,
  MealType,
  FoodItem,
  ServingUnit,
} from "@/lib/food/schemas";
import { MEAL_TYPES } from "@/lib/food/schemas";
import { sumMealEntryMacros } from "@/lib/food/nutrition";
import { useFoodStore } from "@/store/useFoodStore";
import { MacroCoachCard } from "@/components/MacroCoachCard";
import BottomNav from "@/components/BottomNav";
import { MealList } from "@/components/MealList";
import { WellnessStrip } from "@/components/WellnessStrip";
import { FoodSearchModal } from "@/components/FoodSearchModal";
import { ServingSizeSelectorModal } from "@/components/ServingSizeSelectorModal";
import { CustomFoodCreatorModal } from "@/components/CustomFoodCreatorModal";
import { Plus, Award } from "lucide-react";

interface DashboardProps {
  initialEntries?: MealEntry[];
  initialTarget?: DailyTarget;
}

export function Dashboard({
  initialEntries = [],
  initialTarget = { calories: 2200, protein: 160, carbs: 220, fat: 70 },
}: DashboardProps) {
  const store = useFoodStore() as Record<string, any>;
  const storeEntries = useFoodStore((state) => state.mealEntries);
  const hydrate = useFoodStore((state) => state.hydrate);
  const logMealItem = useFoodStore((state) => state.logMealItem);
  const createCustomFood = useFoodStore((state) => state.createCustomFood);

  const [dailyTarget] = useState<DailyTarget>(
    (store.dailyTarget as DailyTarget) ?? initialTarget
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [, setIsTargetsOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const activeEntries: MealEntry[] =
    storeEntries && storeEntries.length > 0 ? storeEntries : initialEntries;

  const todayKey = new Date().toISOString().split("T")[0];

  const todayEntries = useMemo(() => {
    return activeEntries.filter((e) => {
      if (!e.loggedAt) return true;
      return e.loggedAt.startsWith(todayKey);
    });
  }, [activeEntries, todayKey]);

  const yesterdayEntries = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayKey = y.toISOString().split("T")[0];
    return activeEntries.filter((e) => e.loggedAt?.startsWith(yesterdayKey));
  }, [activeEntries]);

  const totals: Macros = useMemo(
    () => sumMealEntryMacros(todayEntries),
    [todayEntries]
  );

  const entriesByMealType = useMemo(() => {
    return MEAL_TYPES.reduce((acc, type) => {
      acc[type] = todayEntries.filter((e) => e.mealType === type);
      return acc;
    }, {} as Record<MealType, MealEntry[]>);
  }, [todayEntries]);

  const yesterdayEntriesByMealType = useMemo(() => {
    return MEAL_TYPES.reduce((acc, type) => {
      acc[type] = yesterdayEntries.filter((e) => e.mealType === type);
      return acc;
    }, {} as Record<MealType, MealEntry[]>);
  }, [yesterdayEntries]);

  const handleRemoveEntry = async (id: string) => {
    if (typeof store.removeMealEntry === "function") {
      await store.removeMealEntry(id);
    } else if (typeof store.removeMealItem === "function") {
      await store.removeMealItem(id);
    } else if (typeof store.deleteMealEntry === "function") {
      await store.deleteMealEntry(id);
    }
  };

  const handleConfirmServing = async (payload: {
    servingUnit: ServingUnit;
    servingAmount: number;
    mealType: MealType;
  }) => {
    if (editingEntry) {
      await handleRemoveEntry(editingEntry.id);
      await logMealItem({
        foodItem: editingEntry.foodItem,
        loggedServing: {
          unit: payload.servingUnit,
          amount: payload.servingAmount,
        },
        mealType: payload.mealType,
      });
      setEditingEntry(null);
      return;
    }

    if (selectedFood) {
      await logMealItem({
        foodItem: selectedFood,
        loggedServing: {
          unit: payload.servingUnit,
          amount: payload.servingAmount,
        },
        mealType: payload.mealType,
      });
      setSelectedFood(null);
      setIsSearchOpen(false);
    }
  };

  const handleRepeatYesterdayMeal = async (
    mealType: MealType,
    entries: MealEntry[]
  ) => {
    for (const entry of entries) {
      await logMealItem({
        foodItem: entry.foodItem,
        loggedServing: entry.loggedServing,
        mealType,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#060709] pb-28 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header Principale */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#060709]/80 px-4 py-3.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 shadow-lg shadow-emerald-500/20">
              M
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white">
                MacroTrack
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                Diario nutrizionale
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTargetsOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-95"
          >
            <Award size={14} className="text-emerald-400" />
            <span>{dailyTarget.calories} kcal</span>
          </button>
        </div>
      </header>

      {/* Contenuto della Dashboard */}
      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        <WellnessStrip dateKey={todayKey} />

        {/* Coach Intelligente Macro */}
        <MacroCoachCard
          totals={totals}
          target={dailyTarget}
          allEntries={todayEntries}
        />

        {/* Lista dei Pasti */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-slate-200">
              Pasti di oggi
            </h2>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Aggiungi Alimento</span>
            </button>
          </div>

          <MealList
            entriesByMealType={entriesByMealType}
            yesterdayEntriesByMealType={yesterdayEntriesByMealType}
            onAddToMeal={(mealType) => {
              setSelectedMealType(mealType);
              setIsSearchOpen(true);
            }}
            onRemove={(id) => void handleRemoveEntry(id)}
            onEditEntry={(entry) => setEditingEntry(entry)}
            onRepeatYesterdayMeal={(mealType, entries) =>
              void handleRepeatYesterdayMeal(mealType, entries)
            }
          />
        </div>
      </main>

      {/* Modale Ricerca Alimenti */}
      {isSearchOpen && (
        <FoodSearchModal
          mealType={selectedMealType}
          onClose={() => setIsSearchOpen(false)}
          onSelect={(food) => setSelectedFood(food)}
          onQuickLog={(food) => {
            void logMealItem({
              foodItem: food,
              loggedServing: food.defaultServing,
              mealType: selectedMealType,
            });
          }}
          onCreateCustom={() => {
            setIsSearchOpen(false);
            setIsCustomModalOpen(true);
          }}
        />
      )}

      {/* Modale Scelta Porzione / Modifica Voce */}
      {(selectedFood || editingEntry) && (
        <ServingSizeSelectorModal
          foodItem={(editingEntry ? editingEntry.foodItem : selectedFood)!}
          initialMealType={
            editingEntry ? editingEntry.mealType : selectedMealType
          }
          initialServingUnit={
            editingEntry
              ? editingEntry.loggedServing.unit
              : selectedFood?.defaultServing.unit
          }
          initialServingAmount={
            editingEntry
              ? editingEntry.loggedServing.amount
              : selectedFood?.defaultServing.amount
          }
          isEditing={Boolean(editingEntry)}
          onClose={() => {
            setSelectedFood(null);
            setEditingEntry(null);
          }}
          onConfirm={handleConfirmServing}
        />
      )}

      {/* Modale Creazione Cibo Personalizzato */}
      {isCustomModalOpen && (
        <CustomFoodCreatorModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          onCreated={(food) => {
            void createCustomFood({
              name: food.name,
              brand: food.brand,
              barcode: food.barcode,
              servingUnit: food.defaultServing.unit,
              servingAmount: food.defaultServing.amount,
              caloriesPer100g: food.macrosPer100g.calories,
              proteinPer100g: food.macrosPer100g.protein,
              carbsPer100g: food.macrosPer100g.carbs,
              fatPer100g: food.macrosPer100g.fat,
            });
            setIsCustomModalOpen(false);
            setSelectedFood(food);
          }}
        />
      )}

      <BottomNav
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTargets={() => setIsTargetsOpen(true)}
      />
    </div>
  );
}

export default Dashboard;