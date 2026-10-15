import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyTargetsTable } from "@/db/schema";
import { DailyTargetSchema } from "@/lib/food/schemas";
import { desc } from "drizzle-orm";

// dynamic rimosso

const DEFAULT_TARGET = {
  calories: 2400,
  protein: 150,
  carbs: 250,
  fat: 75,
};

export async function GET() {
  try {
    const [latest] = await db
      .select()
      .from(dailyTargetsTable)
      .orderBy(desc(dailyTargetsTable.updatedAt))
      .limit(1);

    if (latest) {
      return NextResponse.json({
        target: {
          calories: Math.round(latest.calories),
          protein: Math.round(latest.protein),
          carbs: Math.round(latest.carbs),
          fat: Math.round(latest.fat),
        },
      });
    }
  } catch {
    // Fallback silenzioso
  }

  return NextResponse.json({ target: DEFAULT_TARGET });
}

export async function PUT(request: Request) {
  const body: unknown = await request.json();
  const parsed = DailyTargetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Target non valido", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const [inserted] = await db
      .insert(dailyTargetsTable)
      .values(parsed.data)
      .returning();

    return NextResponse.json({
      target: {
        calories: Math.round(inserted.calories),
        protein: Math.round(inserted.protein),
        carbs: Math.round(inserted.carbs),
        fat: Math.round(inserted.fat),
      },
    });
  } catch {
    return NextResponse.json({ target: parsed.data });
  }
}