import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CreateCustomFoodInput,
  DailyTarget,
  FoodItem,
  LogMealItemInput,
  MealEntry,
} from "@/lib/food/schemas";
import { isSameCalendarDay, sumMealEntryMacros } from "@/lib/food/nutrition";

const DEFAULT_DAILY_TARGET: DailyTarget = {
  calories: 2200,
  protein: 150,
  carbs: 220,
  fat: 70,
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
  removeMealItem: (id: string) => Promise<void>;
  createCustomFood: (input: CreateCustomFoodInput) => Promise<FoodItem>;
  findFoodByBarcode: (barcode: string) => Promise<BarcodeLookupResult>;
  setDailyTarget: (target: DailyTarget) => Promise<void>;
  clearError: () => void;
}

export const useFoodStore = create<FoodStoreState>()(
  persist(
    (set, get) => ({
      foods: [],
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
        set({
          isHydrated: true,
          isLoadingFoods: false,
          isLoadingMeals: false,
          error: null,
        });
      },

      logMealItem: async (input) => {
        set({ isLoggingMeal: true, error: null });
        try {
          const newEntry: MealEntry = {
            id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            foodItem: input.foodItem,
            loggedServing: input.loggedServing,
            mealType: input.mealType,
            loggedAt: input.loggedAt || new Date().toISOString(),
          };

          set((state) => ({
            mealEntries: [newEntry, ...state.mealEntries],
            isLoggingMeal: false,
          }));

          return newEntry;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to log meal item";
          set({ isLoggingMeal: false, error: message });
          throw new Error(message);
        }
      },

      removeMealItem: async (id) => {
        set((state) => ({
          mealEntries: state.mealEntries.filter((entry) => entry.id !== id),
        }));
      },

      createCustomFood: async (input) => {
        set({ isSavingFood: true, error: null });
        try {
          const newFood: FoodItem = {
            id: `custom-${Date.now()}`,
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

          set((state) => ({
            foods: [newFood, ...state.foods],
            isSavingFood: false,
          }));

          return newFood;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create custom food";
          set({ isSavingFood: false, error: message });
          throw new Error(message);
        }
      },

      findFoodByBarcode: async (barcode) => {
        const localMatch = get().foods.find((food) => food.barcode === barcode);
        if (localMatch) {
          return { status: "found", food: localMatch };
        }

        try {
          const res = await fetch(`/api/foods/barcode/${encodeURIComponent(barcode)}`);
          if (res.status === 404) {
            return { status: "not_found", barcode };
          }
          if (!res.ok) {
            return { status: "error", message: "Errore durante la ricerca del barcode" };
          }

          const data = (await res.json()) as { food: FoodItem };
          set((state) => ({ foods: [data.food, ...state.foods] }));
          return { status: "found", food: data.food };
        } catch (err) {
          return {
            status: "error",
            message: err instanceof Error ? err.message : "Errore di connessione a Open Food Facts",
          };
        }
      },

      setDailyTarget: async (target) => {
        set({ dailyTarget: target });
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