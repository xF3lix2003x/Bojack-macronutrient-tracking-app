"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FoodItem } from "@/lib/food/schemas";

interface VisionAnalysisResult {
  suggestedFood: FoodItem;
  confidence: number;
}

interface BarcodeDetectorInstance {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInstance;
  }
}

export function useFoodVisionCapture(onBarcodeDetected?: (barcode: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Fotocamera non supportata dal browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch {
      setError("Permesso fotocamera negato o webcam non disponibile");
      setIsStreaming(false);
    }
  }, []);

  // Scansione automatica dei codici a barre EAN-13 / UPC dal flusso video
  useEffect(() => {
    if (!isStreaming || !onBarcodeDetected || typeof window === "undefined") {
      return;
    }

    if (!window.BarcodeDetector) {
      return;
    }

    let isActive = true;
    const detector = new window.BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    const interval = setInterval(async () => {
      if (!isActive || !videoRef.current || videoRef.current.readyState < 2) {
        return;
      }
      try {
        const barcodes = await detector.detect(videoRef.current);
        const code = barcodes[0]?.rawValue?.trim();
        if (code && code.length >= 6 && code !== lastScannedRef.current) {
          lastScannedRef.current = code;
          onBarcodeDetected(code);
          setTimeout(() => {
            lastScannedRef.current = null;
          }, 4000);
        }
      } catch {
        // Ignora frame non validi
      }
    }, 550);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [isStreaming, onBarcodeDetected]);

  const captureAndAnalyze = useCallback(async (): Promise<VisionAnalysisResult | null> => {
    const video = videoRef.current;
    if (!video || !isStreaming) {
      setError("Fotocamera non pronta");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      const scale = Math.min(
        1,
        maxDim / Math.max(video.videoWidth || 640, video.videoHeight || 480)
      );
      canvas.width = Math.round((video.videoWidth || 640) * scale);
      canvas.height = Math.round((video.videoHeight || 480) * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Impossibile inizializzare il canvas");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.82);

      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'analisi visiva");
      }

      const data = (await response.json()) as VisionAnalysisResult;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore analisi immagine");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isStreaming]);

  return {
    videoRef,
    isStreaming,
    isAnalyzing,
    error,
    startCamera,
    stopCamera,
    captureAndAnalyze,
  };
}