import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CreateCustomFoodInput,
  DailyTarget,
  FoodItem,
  LogMealItemInput,
  MealEntry,
  MealType,
  ServingSize,
} from "@/lib/food/schemas";
import { MOCK_BARCODE_CATALOG } from "@/lib/food/mockCatalog";
import { isSameCalendarDay, sumMealEntryMacros } from "@/lib/food/nutrition";

const DEFAULT_DAILY_TARGET: DailyTarget = {
  calories: 2400,
  protein: 150,
  carbs: 250,
  fat: 75,
};

export type BarcodeLookupResult =
  | { status: "found"; food: FoodItem }
  | { status: "not_found"; barcode: string }
  | { status: "error"; message: string };

interface FoodStoreState {
  foods: FoodItem[];
  mealEntries: MealEntry[];
  dailyTarget: DailyTarget;
  isHydrated: boolean;
  isLoadingFoods: boolean;
  isLoadingMeals: boolean;
  isSavingFood: boolean;
  isLoggingMeal: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  logMealItem: (input: LogMealItemInput) => Promise<MealEntry>;
  updateMealItem: (
    id: string,
    updates: { loggedServing: ServingSize; mealType: MealType }
  ) => Promise<void>;
  repeatMealEntries: (entriesToCopy: MealEntry[], targetDateIso: string) => Promise<MealEntry[]>;
  removeMealItem: (id: string) => Promise<void>;
  createCustomFood: (input: CreateCustomFoodInput) => Promise<FoodItem>;
  findFoodByBarcode: (barcode: string) => Promise<BarcodeLookupResult>;
  setDailyTarget: (target: DailyTarget) => Promise<void>;
  clearError: () => void;
}

function generateLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useFoodStore = create<FoodStoreState>()(
  persist(
    (set, get) => ({
      foods: [...MOCK_BARCODE_CATALOG],
      mealEntries: [],
      dailyTarget: DEFAULT_DAILY_TARGET,
      isHydrated: false,
      isLoadingFoods: false,
      isLoadingMeals: false,
      isSavingFood: false,
      isLoggingMeal: false,
      error: null,

      clearError: () => set({ error: null }),

      hydrate: async () => {
        set({ isLoadingFoods: true, isLoadingMeals: true, error: null });
        try {
          const [foodsRes, mealsRes, targetRes] = await Promise.all([
            fetch("/api/foods"),
            fetch("/api/meals"),
            fetch("/api/targets"),
          ]);

          if (foodsRes.ok && mealsRes.ok && targetRes.ok) {
            const foodsData = (await foodsRes.json()) as { foods: FoodItem[] };
            const mealsData = (await mealsRes.json()) as { entries: MealEntry[] };
            const targetData = (await targetRes.json()) as { target: DailyTarget };

            set({
              foods: foodsData.foods.length > 0 ? foodsData.foods : get().foods,
              mealEntries: mealsData.entries,
              dailyTarget: targetData.target,
              isHydrated: true,
              isLoadingFoods: false,
              isLoadingMeals: false,
            });
            return;
          }
        } catch {
          // Modalità Local-First attiva se il DB non è raggiungibile
        }

        const currentFoods = get().foods;
        set({
          foods: currentFoods.length > 0 ? currentFoods : [...MOCK_BARCODE_CATALOG],
          isHydrated: true,
          isLoadingFoods: false,
          isLoadingMeals: false,
        });
      },

      logMealItem: async (input) => {
        set({ isLoggingMeal: true, error: null });
        const fallbackEntry: MealEntry = {
          id: generateLocalId("meal"),
          foodItem: input.foodItem,
          loggedServing: input.loggedServing,
          mealType: input.mealType,
          loggedAt: input.loggedAt ?? new Date().toISOString(),
        };

        try {
          const response = await fetch("/api/meals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          if (response.ok) {
            const data = (await response.json()) as { entry: MealEntry };
            set({ mealEntries: [data.entry, ...get().mealEntries], isLoggingMeal: false });
            return data.entry;
          }
        } catch {
          // Fallback su localStorage
        }

        set({ mealEntries: [fallbackEntry, ...get().mealEntries], isLoggingMeal: false });
        return fallbackEntry;
      },

      updateMealItem: async (id, updates) => {
        const currentEntries = get().mealEntries;
        const target = currentEntries.find((e) => e.id === id);
        if (!target) return;

        // Aggiornamento ottimistico immediato nello stato locale
        const updatedEntries = currentEntries.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                loggedServing: updates.loggedServing,
                mealType: updates.mealType,
              }
            : entry
        );
        set({ mealEntries: updatedEntries });

        // Sincronizzazione col backend se attivo (rimuove vecchio e ricrea aggiornato)
        try {
          await fetch(`/api/meals/${id}`, { method: "DELETE" });
          await fetch("/api/meals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              foodItem: target.foodItem,
              loggedServing: updates.loggedServing,
              mealType: updates.mealType,
              loggedAt: target.loggedAt,
            }),
          });
        } catch {
          // Già aggiornato localmente
        }
      },

      repeatMealEntries: async (entriesToCopy, targetDateIso) => {
        const created: MealEntry[] = [];
        for (const item of entriesToCopy) {
          const newEntry = await get().logMealItem({
            foodItem: item.foodItem,
            loggedServing: item.loggedServing,
            mealType: item.mealType,
            loggedAt: targetDateIso,
          });
          created.push(newEntry);
        }
        return created;
      },

      removeMealItem: async (id) => {
        const previous = get().mealEntries;
        set({ mealEntries: previous.filter((entry) => entry.id !== id) });
        try {
          await fetch(`/api/meals/${id}`, { method: "DELETE" });
        } catch {
          // Già rimosso localmente
        }
      },

      createCustomFood: async (input) => {
        set({ isSavingFood: true, error: null });
        const localFood: FoodItem = {
          id: generateLocalId("custom"),
          name: input.name,
          brand: input.brand,
          barcode: input.barcode,
          macrosPer100g: {
            calories: input.caloriesPer100g,
            protein: input.proteinPer100g,
            carbs: input.carbsPer100g,
            fat: input.fatPer100g,
          },
          defaultServing: {
            unit: input.servingUnit,
            amount: input.servingAmount,
          },
          isCustom: true,
        };

        try {
          const response = await fetch("/api/foods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          if (response.ok) {
            const data = (await response.json()) as { food: FoodItem };
            set({ foods: [data.food, ...get().foods], isSavingFood: false });
            return data.food;
          }
        } catch {
          // Fallback su localStorage
        }

        set({ foods: [localFood, ...get().foods], isSavingFood: false });
        return localFood;
      },

      findFoodByBarcode: async (barcode) => {
        const clean = barcode.trim();
        const localMatch = get().foods.find((food) => food.barcode === clean);
        if (localMatch) {
          return { status: "found", food: localMatch };
        }

        try {
          const response = await fetch(`/api/foods/barcode/${encodeURIComponent(clean)}`);
          if (response.ok) {
            const data = (await response.json()) as { food: FoodItem };
            set({ foods: [data.food, ...get().foods] });
            return { status: "found", food: data.food };
          }
        } catch {
          // Fallback diretto client-side
        }

        try {
          const offRes = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json`
          );
          if (offRes.ok) {
            const offData = await offRes.json();
            if (offData.status === 1 && offData.product) {
              const p = offData.product;
              const n = p.nutriments || {};
              const food: FoodItem = {
                id: `off-${clean}`,
                name: p.product_name_it || p.product_name || "Prodotto confezionato",
                brand: p.brands ? p.brands.split(",")[0].trim() : undefined,
                barcode: clean,
                macrosPer100g: {
                  calories: Math.round(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0),
                  protein: Number((n.proteins_100g ?? 0).toFixed(1)),
                  carbs: Number((n.carbohydrates_100g ?? 0).toFixed(1)),
                  fat: Number((n.fat_100g ?? 0).toFixed(1)),
                },
                defaultServing: { unit: "g", amount: 100 },
                isCustom: false,
              };
              set({ foods: [food, ...get().foods] });
              return { status: "found", food };
            }
          }
          return { status: "not_found", barcode: clean };
        } catch {
          return { status: "error", message: "Errore di connessione durante la ricerca barcode" };
        }
      },

      setDailyTarget: async (target) => {
        set({ dailyTarget: target });
        try {
          await fetch("/api/targets", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(target),
          });
        } catch {
          // Già salvato localmente
        }
      },
    }),
    {
      name: "calorie-tracker-storage",
      partialize: (state) => ({
        foods: state.foods,
        mealEntries: state.mealEntries,
        dailyTarget: state.dailyTarget,
      }),
    }
  )
);

export function selectTodayMealEntries(entries: readonly MealEntry[]): MealEntry[] {
  const now = new Date().toISOString();
  return entries.filter((entry) => isSameCalendarDay(entry.loggedAt, now));
}

export function selectDailyTotals(entries: readonly MealEntry[]) {
  return sumMealEntryMacros(selectTodayMealEntries(entries));
}

export function selectEntriesByMealType(
  entries: readonly MealEntry[]
): Record<MealEntry["mealType"], MealEntry[]> {
  const todayEntries = selectTodayMealEntries(entries);
  return {
    breakfast: todayEntries.filter((entry) => entry.mealType === "breakfast"),
    lunch: todayEntries.filter((entry) => entry.mealType === "lunch"),
    dinner: todayEntries.filter((entry) => entry.mealType === "dinner"),
    snack: todayEntries.filter((entry) => entry.mealType === "snack"),
  };
}