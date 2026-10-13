import type { FoodItem } from "./schemas";

/**
 * Simulated third-party barcode/nutrition database (e.g. OpenFoodFacts /
 * Nutritionix). In production this module would be replaced by a real HTTP
 * client call from the API route. Barcodes below are fictional but
 * dimensionally realistic (EAN-13 style).
 */
export const MOCK_BARCODE_CATALOG: readonly FoodItem[] = [
  {
    id: "catalog-oat-milk",
    name: "Oat Milk Barista Blend",
    brand: "Nordic Oats",
    barcode: "5901234123457",
    macrosPer100g: { calories: 56, protein: 1, carbs: 6.6, fat: 2.8 },
    defaultServing: { unit: "ml", amount: 250 },
    isCustom: false,
  },
  {
    id: "catalog-greek-yogurt",
    name: "Greek Yogurt 0%",
    brand: "Fjord Farms",
    barcode: "4006381333931",
    macrosPer100g: { calories: 59, protein: 10.3, carbs: 3.6, fat: 0.4 },
    defaultServing: { unit: "g", amount: 170 },
    isCustom: false,
  },
  {
    id: "catalog-chicken-breast",
    name: "Grilled Chicken Breast",
    brand: "FreshFarm",
    barcode: "7501031311309",
    macrosPer100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    defaultServing: { unit: "g", amount: 120 },
    isCustom: false,
  },
  {
    id: "catalog-granola-bar",
    name: "Dark Chocolate Granola Bar",
    brand: "TrailPeak",
    barcode: "8901030865278",
    macrosPer100g: { calories: 448, protein: 8.2, carbs: 58, fat: 19 },
    defaultServing: { unit: "portion", amount: 1 },
    isCustom: false,
  },
  {
    id: "catalog-almond-butter",
    name: "Smooth Almond Butter",
    brand: "NutHouse",
    barcode: "0123456789012",
    macrosPer100g: { calories: 614, protein: 21, carbs: 19, fat: 56 },
    defaultServing: { unit: "g", amount: 32 },
    isCustom: false,
  },
] as const;

/**
 * Deterministic pool used by the mocked vision-analysis endpoint so repeated
 * captures feel varied without needing a real computer-vision backend.
 */
export const MOCK_VISION_POOL: readonly FoodItem[] = [
  {
    id: "vision-grilled-salmon",
    name: "Grilled Salmon Fillet",
    macrosPer100g: { calories: 208, protein: 20, carbs: 0, fat: 13 },
    defaultServing: { unit: "g", amount: 150 },
    isCustom: false,
  },
  {
    id: "vision-mixed-salad",
    name: "Mixed Greens Salad",
    macrosPer100g: { calories: 33, protein: 2.2, carbs: 4.5, fat: 0.8 },
    defaultServing: { unit: "g", amount: 200 },
    isCustom: false,
  },
  {
    id: "vision-steak-rice",
    name: "Sirloin Steak with Rice",
    macrosPer100g: { calories: 215, protein: 16.4, carbs: 20.1, fat: 7.8 },
    defaultServing: { unit: "g", amount: 300 },
    isCustom: false,
  },
  {
    id: "vision-banana",
    name: "Banana",
    macrosPer100g: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
    defaultServing: { unit: "portion", amount: 1 },
    isCustom: false,
  },
  {
    id: "vision-avocado-toast",
    name: "Avocado Toast",
    macrosPer100g: { calories: 243, protein: 6.8, carbs: 24.5, fat: 14 },
    defaultServing: { unit: "g", amount: 180 },
    isCustom: false,
  },
] as const;

export function findInMockCatalog(barcode: string): FoodItem | undefined {
  return MOCK_BARCODE_CATALOG.find((item) => item.barcode === barcode);
}

/** Simple deterministic hash so the same image payload yields the same mock result. */
export function hashStringToIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}
