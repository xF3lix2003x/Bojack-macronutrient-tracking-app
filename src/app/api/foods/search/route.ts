import { randomUUID } from "crypto";
import type { FoodItem } from "@/lib/food/schemas";

// dynamic rimosso

interface OpenFoodFactsNutriments {
  "energy-kcal_100g"?: number;
  "energy-kcal"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  product_name_it?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OpenFoodFactsNutriments;
}

function parseServingAmount(servingSizeStr?: string): number {
  if (!servingSizeStr) return 100;
  const match = servingSizeStr.match(/(\d+(?:[.,]\d+)?)/);
  if (match) {
    const val = parseFloat(match[1].replace(",", "."));
    return Number.isFinite(val) && val > 0 ? val : 100;
  }
  return 100;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return Response.json({ foods: [] });
  }

  try {
    const url = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query,
    )}&search_simple=1&action=process&json=1&page_size=25`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "MacroTrackApp/1.0 (NextJS Calorie Tracker)",
      },
    });

    if (!res.ok) {
      return Response.json({ foods: [] });
    }

    const data = await res.json();
    const products: OpenFoodFactsProduct[] = data.products || [];

    const mappedFoods: FoodItem[] = products
      .filter((p) => Boolean(p.product_name_it || p.product_name))
      .map((p) => {
        const nutriments = p.nutriments || {};
        const calories = Math.round(
          nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? 0,
        );
        const protein = Number((nutriments.proteins_100g ?? 0).toFixed(1));
        const carbs = Number((nutriments.carbohydrates_100g ?? 0).toFixed(1));
        const fat = Number((nutriments.fat_100g ?? 0).toFixed(1));

        return {
          id: p.code ? `off-${p.code}` : `off-gen-${randomUUID().slice(0, 8)}`,
          name: p.product_name_it || p.product_name || "Prodotto sconosciuto",
          brand: p.brands ? p.brands.split(",")[0].trim() : undefined,
          barcode: p.code,
          macrosPer100g: { calories, protein, carbs, fat },
          defaultServing: {
            unit: "g",
            amount: parseServingAmount(p.serving_size),
          },
          isCustom: false,
        };
      });

    return Response.json({ foods: mappedFoods });
  } catch {
    return Response.json({ foods: [] });
  }
}