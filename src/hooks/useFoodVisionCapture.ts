"use client";

import { useCallback, useState } from "react";
import type { FoodItem } from "@/lib/food/schemas";

export type VisionCaptureStatus = "idle" | "reading" | "analyzing" | "success" | "error";

interface VisionCaptureState {
  status: VisionCaptureStatus;
  previewUrl: string | null;
  suggestedFood: FoodItem | null;
  confidence: number | null;
  error: string | null;
}

interface UseFoodVisionCapture extends VisionCaptureState {
  analyzeFile: (file: File) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: VisionCaptureState = {
  status: "idle",
  previewUrl: null,
  suggestedFood: null,
  confidence: null,
  error: null,
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export function useFoodVisionCapture(): UseFoodVisionCapture {
  const [state, setState] = useState<VisionCaptureState>(INITIAL_STATE);

  const analyzeFile = useCallback(async (file: File) => {
    setState({ ...INITIAL_STATE, status: "reading" });
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setState((prev) => ({ ...prev, status: "analyzing", previewUrl: dataUrl }));

      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Vision analysis failed");
      }

      const data = (await response.json()) as { suggestedFood: FoodItem; confidence: number };
      setState((prev) => ({
        ...prev,
        status: "success",
        suggestedFood: data.suggestedFood,
        confidence: data.confidence,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Vision analysis failed",
      }));
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { ...state, analyzeFile, reset };
}
