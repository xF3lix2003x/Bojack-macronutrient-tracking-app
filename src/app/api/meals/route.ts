import { NextResponse } from "next/server";
import { LogMealItemInputSchema, type MealEntry } from "@/lib/food/schemas";

// Fallback in memoria quando PostgreSQL (127.0.0.1:5432) non è attivo
const globalForMeals = globalThis as unknown as {
  __botrackMeals?: MealEntry[];
};

function getMemoryMeals(): MealEntry[] {
  if (!globalForMeals.__botrackMeals) {
    globalForMeals.__botrackMeals = [];
  }
  return globalForMeals.__botrackMeals;
}

export async function GET() {
  const meals = getMemoryMeals();
  return NextResponse.json({
    entries: meals,
    meals: meals,
    mealEntries: meals,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LogMealItemInputSchema.safeParse(body);

    const foodItem = parsed.success ? parsed.data.foodItem : body.foodItem;
    const loggedServing = parsed.success
      ? parsed.data.loggedServing
      : body.loggedServing ?? { unit: "g", amount: 100 };
    const mealType = parsed.success
      ? parsed.data.mealType
      : body.mealType ?? "snack";
    const loggedAt =
      (parsed.success ? parsed.data.loggedAt : body.loggedAt) ??
      new Date().toISOString();

    const newEntry: MealEntry = {
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      mealType,
      foodItem,
      loggedServing,
      loggedAt,
    };

    const meals = getMemoryMeals();
    globalForMeals.__botrackMeals = [newEntry, ...meals];

    return NextResponse.json(
      {
        ...newEntry,
        entry: newEntry,
        meal: newEntry,
        mealEntry: newEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore salvataggio pasto" },
      { status: 400 }
    );
  }
}