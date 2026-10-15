import { NextResponse } from "next/server";
import type { MealEntry } from "@/lib/food/schemas";

const globalForMeals = globalThis as unknown as {
  __botrackMeals?: MealEntry[];
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (globalForMeals.__botrackMeals) {
    globalForMeals.__botrackMeals = globalForMeals.__botrackMeals.filter(
      (e) => e.id !== id
    );
  }
  return NextResponse.json({ ok: true, id });
}