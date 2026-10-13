import { hashStringToIndex, MOCK_VISION_POOL } from "@/lib/food/mockCatalog";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VisionAnalyzeRequestSchema = z.object({
  imageBase64: z.string().min(50, "Image payload looks too small to analyze"),
});

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = VisionAnalyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid vision analysis payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Simulate latency of a real computer-vision API round trip (e.g. a
  // LogMeal / Nutritionix / custom model inference call).
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const { imageBase64 } = parsed.data;
  const index = hashStringToIndex(imageBase64.slice(-256), MOCK_VISION_POOL.length);
  const suggestedFood = MOCK_VISION_POOL[index];
  const confidence = 0.62 + (hashStringToIndex(imageBase64.slice(0, 64), 34) / 100);

  return Response.json({
    suggestedFood,
    confidence: Math.min(0.96, Number(confidence.toFixed(2))),
  });
}
