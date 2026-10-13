import { db } from "@/db";
import { dailyTargetsTable } from "@/db/schema";
import { DailyTargetSchema } from "@/lib/food/schemas";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULT_TARGET_ID = "default";
const FALLBACK_TARGET = { calories: 2200, protein: 150, carbs: 220, fat: 70 } as const;

export async function GET() {
  const [row] = await db
    .select()
    .from(dailyTargetsTable)
    .where(eq(dailyTargetsTable.id, DEFAULT_TARGET_ID))
    .limit(1);

  if (!row) {
    return Response.json({ target: FALLBACK_TARGET });
  }

  return Response.json({
    target: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
    },
  });
}

export async function PUT(request: Request) {
  const body: unknown = await request.json();
  const parsed = DailyTargetSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid daily target payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const target = parsed.data;

  const [row] = await db
    .insert(dailyTargetsTable)
    .values({ id: DEFAULT_TARGET_ID, ...target, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: dailyTargetsTable.id,
      set: { ...target, updatedAt: new Date() },
    })
    .returning();

  return Response.json({
    target: { calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat },
  });
}
