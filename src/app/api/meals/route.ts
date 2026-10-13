import { randomUUID } from "crypto";
import { db } from "@/db";
import { mealEntriesTable } from "@/db/schema";
import { mealEntryRowToMealEntry } from "@/lib/food/mappers";
import { LogMealItemInputSchema } from "@/lib/food/schemas";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(mealEntriesTable)
    .orderBy(desc(mealEntriesTable.loggedAt));
  return Response.json({ entries: rows.map(mealEntryRowToMealEntry) });
}

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = LogMealItemInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid meal entry payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();

  const [row] = await db
    .insert(mealEntriesTable)
    .values({
      id: randomUUID(),
      foodId: input.foodItem.isCustom || input.foodItem.id ? input.foodItem.id : null,
      foodItem: input.foodItem,
      loggedServingUnit: input.loggedServing.unit,
      loggedServingAmount: input.loggedServing.amount,
      mealType: input.mealType,
      loggedAt,
    })
    .returning();

  return Response.json({ entry: mealEntryRowToMealEntry(row) }, { status: 201 });
}
