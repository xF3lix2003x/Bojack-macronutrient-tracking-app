import { db } from "@/db";
import { mealEntriesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const deleted = await db
    .delete(mealEntriesTable)
    .where(eq(mealEntriesTable.id, id))
    .returning({ id: mealEntriesTable.id });

  if (deleted.length === 0) {
    return Response.json({ error: "Meal entry not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
