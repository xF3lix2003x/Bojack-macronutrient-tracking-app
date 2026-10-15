import { NextResponse } from "next/server";
import type { FoodItem } from "@/lib/food/schemas";
import { ITALIAN_STAPLE_FOODS } from "@/lib/food/italianBaseFoods";

const globalForFoods = globalThis as unknown as {
  __botrackCustomFoods?: FoodItem[];
};

function getCustomFoods(): FoodItem[] {
  if (!globalForFoods.__botrackCustomFoods) {
    globalForFoods.__botrackCustomFoods = [];
  }
  return globalForFoods.__botrackCustomFoods;
}

export async function GET() {
  const custom = getCustomFoods();
  const foods = [...custom, ...ITALIAN_STAPLE_FOODS];
  return NextResponse.json({ foods, items: foods });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newFood: FoodItem = {
      id: body.id ?? `custom-${Date.now()}`,
      name: String(body.name ?? "Alimento Custom").trim(),
      brand: body.brand ? String(body.brand).trim() : undefined,
      barcode: body.barcode ? String(body.barcode).trim() : undefined,
      macrosPer100g: body.macrosPer100g ?? {
        calories: Number(body.caloriesPer100g ?? body.calories ?? 0),
        protein: Number(body.proteinPer100g ?? body.protein ?? 0),
        carbs: Number(body.carbsPer100g ?? body.carbs ?? 0),
        fat: Number(body.fatPer100g ?? body.fat ?? 0),
      },
      defaultServing: body.defaultServing ?? {
        unit: body.servingUnit ?? "g",
        amount: Number(body.servingAmount ?? 100),
      },
      isCustom: true,
    };

    const custom = getCustomFoods();
    globalForFoods.__botrackCustomFoods = [newFood, ...custom];

    return NextResponse.json(
      { ...newFood, food: newFood, item: newFood },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore creazione cibo" },
      { status: 400 }
    );
  }
}