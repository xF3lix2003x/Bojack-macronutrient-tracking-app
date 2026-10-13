import { randomUUID } from "crypto";
import type { FoodItem } from "@/lib/food/schemas";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ barcode: string }> };

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

export async function GET(_request: Request, { params }: RouteParams) {
  const { barcode } = await params;
  const cleanBarcode = barcode.trim();

  try {
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
    const res = await fetch(offUrl, {
      headers: {
        "User-Agent": "MacroTrackApp/1.0 (NextJS Calorie Tracker)",
      },
    });

    if (!res.ok) {
      return Response.json(
        { error: "Errore durante la chiamata a Open Food Facts", barcode: cleanBarcode },
        { status: 502 },
      );
    }

    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return Response.json(
        { error: "Prodotto non trovato su Open Food Facts", barcode: cleanBarcode },
        { status: 404 },
      );
    }

    const p: OpenFoodFactsProduct = data.product;
    const nutriments = p.nutriments || {};

    const name = p.product_name_it || p.product_name || "Prodotto sconosciuto";
    const brand = p.brands ? p.brands.split(",")[0].trim() : undefined;
    const calories = Math.round(nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? 0);
    const protein = Number((nutriments.proteins_100g ?? 0).toFixed(1));
    const carbs = Number((nutriments.carbohydrates_10