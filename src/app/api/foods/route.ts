import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ITALIAN_STAPLE_FOODS } from "@/lib/food/italianBaseFoods";
import type { FoodItem } from "@/lib/food/schemas";

// dynamic rimosso

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

async function searchOpenFoodFactsV2(query: string): Promise<FoodItem[]> {
  try {
    const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,product_name_it,brands,nutriments,serving_quantity`;

    const res = await fetch(url, {
      headers: { "User-Agent": "MacroTrackApp/2.0 (NextJS)" },
      signal: AbortSignal.timeout(6500),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];

    return products
      .filter((p: any) => (p.product_name_it || p.product_name) && p.nutriments)
      .map((p: any): FoodItem => {
        const n = p.nutriments;
        const calories = clamp(Math.round(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0), 0, 900);
        const protein = clamp(Number((n.proteins_100g ?? 0).toFixed(1)), 0, 100);
        const carbs = clamp(Number((n.carbohydrates_100g ?? 0).toFixed(1)), 0, 100);
        const fat = clamp(Number((n.fat_100g ?? 0).toFixed(1)), 0, 100);
        const servingAmount = clamp(Number(p.serving_quantity) || 100, 1, 1000);

        return {
          id: p.code ? `off-${p.code}` : `off-${randomUUID().slice(0, 8)}`,
          name: (p.product_name_it || p.product_name || "Alimento").trim(),
          brand: p.brands ? p.brands.split(",")[0].trim() : "OpenFoodFacts",
          barcode: p.code && String(p.code).length >= 6 ? String(p.code) : undefined,
          macrosPer100g: { calories, protein, carbs, fat },
          defaultServing: { unit: "g", amount: servingAmount },
          isCustom: false,
        };
      })
      .filter((f: FoodItem) => f.macrosPer100g.calories > 0 || f.macrosPer100g.protein > 0);
  } catch {
    return [];
  }
}

async function searchUSDA(query: string): Promise<FoodItem[]> {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
      query
    )}&pageSize=6`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return [];
    const data = await res.json();
    const foods = Array.isArray(data.foods) ? data.foods : [];

    return foods
      .map((item: any): FoodItem => {
        const nutrients = Array.isArray(item.foodNutrients) ? item.foodNutrients : [];
        const getNutrient = (id: number) =>
          nutrients.find((n: any) => n.nutrientId === id)?.value ?? 0;

        const calories = clamp(Math.round(getNutrient(1008)), 0, 900);
        const protein = clamp(Number(getNutrient(1003).toFixed(1)), 0, 100);
        const fat = clamp(Number(getNutrient(1004).toFixed(1)), 0, 100);
        const carbs = clamp(Number(getNutrient(1005).toFixed(1)), 0, 100);

        return {
          id: `usda-${item.fdcId}`,
          name: String(item.description || query).trim(),
          brand: item.brandOwner ? `${item.brandOwner} (USDA)` : "USDA Database",
          macrosPer100g: { calories, protein, carbs, fat },
          defaultServing: { unit: "g", amount: 100 },
          isCustom: false,
        };
      })
      .filter((f: FoodItem) => f.macrosPer100g.calories > 0);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ foods: [] });
  }

  const normalized = q.toLowerCase();

  const stapleMatches = ITALIAN_STAPLE_FOODS.filter(
    (item) =>
      item.name.toLowerCase().includes(normalized) ||
      item.brand?.toLowerCase().includes(normalized)
  );

  const [offResults, usdaResults] = await Promise.all([
    searchOpenFoodFactsV2(q),
    searchUSDA(q),
  ]);

  return NextResponse.json({
    foods: [...stapleMatches, ...offResults, ...usdaResults],
  });
}