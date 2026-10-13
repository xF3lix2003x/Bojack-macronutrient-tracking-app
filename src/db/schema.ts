import { boolean, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import type { FoodItem } from "@/lib/food/schemas";

export const foodsTable = pgTable("foods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  barcode: text("barcode").unique(),
  caloriesPer100g: real("calories_per_100g").notNull(),
  proteinPer100g: real("protein_per_100g").notNull(),
  carbsPer100g: real("carbs_per_100g").notNull(),
  fatPer100g: real("fat_per_100g").notNull(),
  servingUnit: text("serving_unit").notNull(),
  servingAmount: real("serving_amount").notNull(),
  isCustom: boolean("is_custom").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mealEntriesTable = pgTable("meal_entries", {
  id: text("id").primaryKey(),
  foodId: text("food_id"),
  foodItem: jsonb("food_item").$type<FoodItem>().notNull(),
  loggedServingUnit: text("logged_serving_unit").notNull(),
  loggedServingAmount: real("logged_serving_amount").notNull(),
  mealType: text("meal_type").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyTargetsTable = pgTable("daily_targets", {
  id: text("id").primaryKey().default("default"),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
