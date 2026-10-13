"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useFoodStore, selectDailyTotals, selectEntriesByMealType } from "@/store/useFoodStore";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { MealList } from "@/components/MealList";
import { FoodSearchModal } from "@/components/FoodSearchModal";
import { CustomFoodCreatorModal } from "@/components/CustomFoodCreatorModal";
import { ServingSizeSelectorModal } from "@/components/ServingSizeSelectorModal";
import { DailyTargetModal } from "@/components/DailyTargetModal";
import type { FoodItem, MealType, ServingUnit } from "@/lib/food/schemas";

type ActiveModal = "none" | "search" | "custom" | "targets";

export function Dashboard() {
  const router = useRouter();
  const foods = useFoodStore((state) => state.foods);
  const mealEntries = useFoodStore((state) => state.mealEntries);
  const dailyTarget = useFoodStore((state) => state.dailyTarget);
  const isHydrated = useFoodStore((state) => state.isHydrated);
  const error = useFoodStore((state) => state.error);
  const clearError = useFoodStore((state) => state.clearError);
  const hydrate = useFoodStore((state) => state.hydrate);
  const logMealItem = useFoodStore((state) => state.logMealItem);
  const removeMealItem = useFoodStore((state) => state.removeMealItem);

  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [servingFood, setServingFood] = useState<FoodItem | null>(null);
  const [targetMealType, setTargetMealType] = useState<MealType>("snack");

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = selectDailyTotals(mealEntries);
  const entriesByMealType = selectEntriesByMealType(mealEntries);

  const handleAddToMeal = (mealType: MealType) => {
    setTargetMealType(mealType);
    setActiveModal("search");
  };

  const handleSelectFood = (food: FoodItem) => {
    setActiveModal("none");
    setServingFood(food);
  };

  const handleConfirmServing = async (payload: {
    servingUnit: ServingUnit;
    servingAmount: number;
    mealType: MealType;
  }) => {
    if (!servingFood) return;
    await logMealItem({
      foodItem: servingFood,
      loggedServing: { unit: payload.servingUnit, amount: payload.servingAmount },
      mealType: payload.mealType,
    });
    setServingFood(null);
  };

  if (!isHydrated && foods.length === 0 && mealEntries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090a0f]">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  const todayFormatted = `Oggi, ${new Date().toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
  })}`;

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-5 pb-28 pt-6">
        <div>
          <header className="flex items-center justify-between pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
              {todayFormatted}
            </h1>
            <button
              type="button"
              onClick={() => setActiveModal("targets")}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 transition hover:border-zinc-500"
              aria-label="Profilo e Target"
            >
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-400 text-sm font-semibold text-white">
                👤
              </div>
            </button>
          </header>

          {error && (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={clearError} className="text-xs underline">
                Chiudi
              </button>
            </div>
          )}

          <DailySummaryCard totals={totals} target={dailyTarget} />

          <div className="mt-8">
            <MealList
              entriesByMealType={entriesByMealType}
              onRemove={removeMealItem}
              onAddToMeal={handleAddToMeal}
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/95 to-transparent px-5 pb-6 pt-4">
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={() => router.push("/scanner")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-zinc-950 shadow-[0_10px_30px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 active:scale-[0.99]"
            >
              <Plus size={20} strokeWidth={2.5} />
              Aggiungi pasto/Scansione
            </button>
          </div>
        </div>
      </div>

      {activeModal === "search" && (
        <FoodSearchModal
          onClose={() => setActiveModal("none")}
          onSelect={handleSelectFood}
          onCreateCustom={() => setActiveModal("custom")}
        />
      )}
      {activeModal === "custom" && (
        <CustomFoodCreatorModal
          onClose={() => setActiveModal("none")}
          onCreated={(food) => {
            setActiveModal("none");
            setServingFood(food);
          }}
        />
      )}
      {activeModal === "targets" && (
        <DailyTargetModal current={dailyTarget} onClose={() => setActiveModal("none")} />
      )}
      {servingFood && (
        <ServingSizeSelectorModal
          foodItem={servingFood}
          initialMealType={targetMealType}
          onClose={() => setServingFood(null)}
          onConfirm={handleConfirmServing}
        />
      )}
    </div>
  );
}