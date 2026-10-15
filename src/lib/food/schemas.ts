import { z } from "zod";

export const MealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export type MealType = z.infer<typeof MealTypeSchema>;

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const ServingUnitSchema = z.enum(["g", "ml", "pz", "portion"]);
export type ServingUnit = z.infer<typeof ServingUnitSchema>;

export const SERVING_UNITS: ServingUnit[] = ["g", "ml", "pz", "portion"];

export const MacrosSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export type Macros = z.infer<typeof MacrosSchema>;
export type MacroNutrients = Macros;
export const MacroNutrientsSchema = MacrosSchema;

export const ServingSizeSchema = z.object({
  unit: ServingUnitSchema,
  amount: z.number(),
});

export type ServingSize = z.infer<typeof ServingSizeSchema>;

export const FoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  macrosPer100g: MacrosSchema,
  defaultServing: ServingSizeSchema,
  isCustom: z.boolean().optional(),
});

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  macrosPer100g: Macros;
  defaultServing: {
    unit: ServingUnit;
    amount: number;
  };
  isCustom?: boolean;
}

export const MealEntrySchema = z.object({
  id: z.string(),
  mealType: MealTypeSchema,
  foodItem: FoodItemSchema,
  loggedServing: ServingSizeSchema,
  loggedAt: z.string(),
});

export interface MealEntry {
  id: string;
  mealType: MealType;
  foodItem: FoodItem;
  loggedServing: {
    unit: ServingUnit;
    amount: number;
  };
  loggedAt: string;
}

export const CreateCustomFoodInputSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  servingUnit: ServingUnitSchema,
  servingAmount: z.number(),
  caloriesPer100g: z.number(),
  proteinPer100g: z.number(),
  carbsPer100g: z.number(),
  fatPer100g: z.number(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
});

export type CreateCustomFoodInput = z.infer<typeof CreateCustomFoodInputSchema>;

export const DailyTargetSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export type DailyTarget = z.infer<typeof DailyTargetSchema>;

export const LogMealItemInputSchema = z.object({
  mealType: MealTypeSchema,
  foodId: z.string().optional(),
  foodName: z.string().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  macros: MacrosSchema.optional(),
  loggedAt: z.string().optional(),
  foodItem: FoodItemSchema,
  loggedServing: ServingSizeSchema.default({ unit: "g", amount: 100 }),
});

export type LogMealItemInput = z.infer<typeof LogMealItemInputSchema>;