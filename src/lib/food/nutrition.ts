import type { FoodItem, MacroNutrients, MealEntry, ServingSize } from "./schemas";

/**
 * Rounds a macro value to one decimal place to avoid floating point noise
 * while still showing meaningful precision in the UI.
 */
export function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Resolves the equivalent gram/ml quantity represented by a given serving
 * size for a food item. `g` and `ml` map 1:1 onto the 100g/100ml basis used
 * by `macrosPer100g`. A `portion` serving is a multiplier of the food's own
 * default serving (e.g. "2 portions" of a food whose default serving is
 * 50g resolves to 100g).
 */
export function resolveServingGrams(foodItem: FoodItem, serving: ServingSize): number {
  if (serving.unit === "portion") {
    const baseGrams =
      foodItem.defaultServing.unit === "portion" ? 100 : foodItem.defaultServing.amount;
    return serving.amount * baseGrams;
  }
  return serving.amount;
}

/**
 * Scales a food's per-100g macro profile to an arbitrary gram quantity.
 */
export function scaleMacrosToGrams(macrosPer100g: MacroNutrients, grams: number): MacroNutrients {
  const factor = grams / 100;
  return {
    calories: roundMacro(macrosPer100g.calories * factor),
    protein: roundMacro(macrosPer100g.protein * factor),
    carbs: roundMacro(macrosPer100g.carbs * factor),
    fat: roundMacro(macrosPer100g.fat * factor),
  };
}

/**
 * Computes the actual macro totals for a food item logged with a given
 * serving size, accounting for the `portion` unit indirection.
 */
export function computeMacrosForServing(foodItem: FoodItem, serving: ServingSize): MacroNutrients {
  const grams = resolveServingGrams(foodItem, serving);
  return scaleMacrosToGrams(foodItem.macrosPer100g, grams);
}

export function sumMacros(entries: readonly MacroNutrients[]): MacroNutrients {
  return entries.reduce<MacroNutrients>(
    (total, current) => ({
      calories: roundMacro(total.calories + current.calories),
      protein: roundMacro(total.protein + current.protein),
      carbs: roundMacro(total.carbs + current.carbs),
      fat: roundMacro(total.fat + current.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function sumMealEntryMacros(entries: readonly MealEntry[]): MacroNutrients {
  return sumMacros(entries.map((entry) => computeMacrosForServing(entry.foodItem, entry.loggedServing)));
}

/** Derives calories from macros using the Atwater general factors (4/4/9). */
export function estimateCaloriesFromMacros(macros: Omit<MacroNutrients, "calories">): number {
  return roundMacro(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9);
}

export function formatServingLabel(serving: ServingSize): string {
  const amount = Number.isInteger(serving.amount) ? serving.amount : roundMacro(serving.amount);
  if (serving.unit === "portion") {
    return `${amount} ${amount === 1 ? "portion" : "portions"}`;
  }
  return `${amount}${serving.unit}`;
}

export function isSameCalendarDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
