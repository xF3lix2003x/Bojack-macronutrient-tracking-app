import { z } from "zod";

/**
 * ---------------------------------------------------------------------------
 * Primitive domain schemas
 * ---------------------------------------------------------------------------
 */

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const SERVING_UNITS = ["g", "ml", "portion"] as const;
export type ServingUnit = (typeof SERVING_UNITS)[number];

/** Upper bounds chosen to keep user input realistic (per 100g basis). */
const MAX_CALORIES_PER_100G = 902; // pure fat/oil ceiling
const MAX_MACRO_GRAMS_PER_100G = 100;
const MAX_SERVING_AMOUNT = 5000;

export const MacroNutrientsSchema = z.object({
  calories: z
    .number()
    .nonnegative("Calories cannot be negative")
    .max(MAX_CALORIES_PER_100G, `Calories cannot exceed ${MAX_CALORIES_PER_100G} kcal`),
  protein: z
    .number()
    .nonnegative("Protein cannot be negative")
    .max(MAX_MACRO_GRAMS_PER_100G, `Protein cannot exceed ${MAX_MACRO_GRAMS_PER_100G}g`),
  carbs: z
    .number()
    .nonnegative("Carbs cannot be negative")
    .max(MAX_MACRO_GRAMS_PER_100G, `Carbs cannot exceed ${MAX_MACRO_GRAMS_PER_100G}g`),
  fat: z
    .number()
    .nonnegative("Fat cannot be negative")
    .max(MAX_MACRO_GRAMS_PER_100G, `Fat cannot exceed ${MAX_MACRO_GRAMS_PER_100G}g`),
});
export type MacroNutrients = z.infer<typeof MacroNutrientsSchema>;

export const ServingSizeSchema = z.object({
  unit: z.enum(SERVING_UNITS),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(MAX_SERVING_AMOUNT, `Amount cannot exceed ${MAX_SERVING_AMOUNT}`),
});
export type ServingSize = z.infer<typeof ServingSizeSchema>;

export const FoodItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().trim().max(120).optional(),
  barcode: z.string().trim().min(6).max(32).optional(),
  macrosPer100g: MacroNutrientsSchema,
  defaultServing: ServingSizeSchema,
  isCustom: z.boolean(),
});
export type FoodItem = z.infer<typeof FoodItemSchema>;

export const MealEntrySchema = z.object({
  id: z.string().min(1),
  foodItem: FoodItemSchema,
  loggedServing: ServingSizeSchema,
  mealType: z.enum(MEAL_TYPES),
  loggedAt: z.string().min(1),
});
export type MealEntry = z.infer<typeof MealEntrySchema>;

export const DailyTargetSchema = z.object({
  calories: z.number().nonnegative().max(10000),
  protein: z.number().nonnegative().max(1000),
  carbs: z.number().nonnegative().max(1000),
  fat: z.number().nonnegative().max(1000),
});
export type DailyTarget = z.infer<typeof DailyTargetSchema>;

/**
 * ---------------------------------------------------------------------------
 * Input schemas (forms / API payloads)
 * ---------------------------------------------------------------------------
 */

export const CreateCustomFoodInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  barcode: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  servingUnit: z.enum(SERVING_UNITS),
  servingAmount: z
    .number()
    .positive("Serving amount must be greater than zero")
    .max(MAX_SERVING_AMOUNT),
  caloriesPer100g: MacroNutrientsSchema.shape.calories,
  proteinPer100g: MacroNutrientsSchema.shape.protein,
  carbsPer100g: MacroNutrientsSchema.shape.carbs,
  fatPer100g: MacroNutrientsSchema.shape.fat,
});
export type CreateCustomFoodInput = z.infer<typeof CreateCustomFoodInputSchema>;

export const LogMealItemInputSchema = z.object({
  foodItem: FoodItemSchema,
  loggedServing: ServingSizeSchema,
  mealType: z.enum(MEAL_TYPES),
  loggedAt: z.string().optional(),
});
export type LogMealItemInput = z.infer<typeof LogMealItemInputSchema>;

export const VisionAnalysisResultSchema = z.object({
  suggestedFood: FoodItemSchema,
  confidence: z.number().min(0).max(1),
});
export type VisionAnalysisResult = z.infer<typeof VisionAnalysisResultSchema>;
