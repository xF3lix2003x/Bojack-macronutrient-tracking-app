import type { foodsTable, mealEntriesTable } from "@/db/schema";
import type { FoodItem, MealEntry, MealType, ServingUnit } from "./schemas";

type FoodRow = typeof foodsTable.$inferSelect;
type MealEntryRow = typeof mealEntriesTable.$inferSelect;

export function foodRowToFoodItem(row: FoodRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    barcode: row.barcode ?? undefined,
    macrosPer100g: {
      calories: row.caloriesPer100g,
      protein: row.proteinPer100g,
      carbs: row.carbsPer100g,
      fat: row.fatPer100g,
    },
    defaultServing: {
      unit: row.servingUnit as ServingUnit,
      amount: row.servingAmount,
    },
    isCustom: row.isCustom,
  };
}

export function mealEntryRowToMealEntry(row: MealEntryRow): MealEntry {
  return {
    id: row.id,
    foodItem: row.foodItem,
    loggedServing: {
      unit: row.loggedServingUnit as ServingUnit,
      amount: row.loggedServingAmount,
    },
    mealType: row.mealType as MealType,
    loggedAt: row.loggedAt.toISOString(),
  };
}
