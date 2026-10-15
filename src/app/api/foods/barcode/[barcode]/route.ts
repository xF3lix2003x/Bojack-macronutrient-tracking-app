import { NextResponse } from "next/server";
import { ITALIAN_STAPLE_FOODS } from "@/lib/food/italianBaseFoods";
import { MOCK_BARCODE_CATALOG } from "@/lib/food/mockCatalog";
import type { FoodItem } from "@/lib/food/schemas";

export const dynamic = "force-dynamic";

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  code?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;

  const foundMock = MOCK_BARCODE_CATALOG.find((f) => f.barcode === barcode);
  if (foundMock) {
    return NextResponse.json({ food: foundMock });
  }

  const foundStaple = ITALIAN_STAPLE_FOODS.find((f) => f.barcode === barcode);
  if (foundStaple) {
    return NextResponse.json({ food: foundStaple });
  }

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: {
        "User-Agent": "MacroTrackApp/1.0 (Educational Project)",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error("Errore Open Food Facts");
    }

    const data = (await response.json()) as OpenFoodFactsResponse;

    if (data.status === 1 && data.product) {
      const p = data.product;
      const nutriments = p.nutriments ?? {};

      const calories = Math.round(
        nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? 0
      );
      const protein = Number((nutriments.proteins_100g ?? 0).toFixed(1));
      const carbs = Number((nutriments.carbohydrates_100g ?? 0).toFixed(1));
      const fat = Number((nutriments.fat_100g ?? 0).toFixed(1));

      const foodItem: FoodItem = {
        id: `off-${barcode}`,
        name: p.product_name || `Prodotto ${barcode}`,
        brand: p.brands || "Open Food Facts",
        barcode: barcode,
        macrosPer100g: {
          calories,
          protein,
          carbs,
          fat,
        },
        defaultServing: {
          unit: "g",
          amount: p.serving_quantity || 100,
        },
        isCustom: false,
      };

      return NextResponse.json({ food: foodItem });
    }
  } catch {
    // Fallback in caso di errore di rete
  }

  return NextResponse.json(
    { error: "Alimento non trovato" },
    { status: 404 }
  );
}