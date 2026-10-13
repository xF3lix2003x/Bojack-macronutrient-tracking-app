"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useFoodStore, type BarcodeLookupResult } from "@/store/useFoodStore";
import { useFoodVisionCapture } from "@/hooks/useFoodVisionCapture";
import { ServingSizeSelectorModal } from "@/components/ServingSizeSelectorModal";
import { CustomFoodCreatorModal } from "@/components/CustomFoodCreatorModal";
import type { FoodItem, MealType, ServingUnit } from "@/lib/food/schemas";

type ScanMode = "barcode" | "vision";

const DEMO_BARCODES = [
  "5901234123457",
  "4006381333931",
  "7501031311309",
  "8901030865278",
  "0123456789012",
  "0000000000000",
];

export function ScannerView() {
  const router = useRouter();
  const logMealItem = useFoodStore((state) => state.logMealItem);
  const findFoodByBarcode = useFoodStore((state) => state.findFoodByBarcode);

  const [mode, setMode] = useState<ScanMode>("barcode");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [barcodeStatus, setBarcodeStatus] = useState<"idle" | "loading" | "not_found" | "error">(
    "idle",
  );
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [activeFood, setActiveFood] = useState<FoodItem | null>(null);
  const [lastLogged, setLastLogged] = useState<string | null>(null);
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);

  const vision = useFoodVisionCapture();

  const stopCamera = useCallback(() => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraReady(true);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? `Camera unavailable: ${err.message}. Use manual entry or gallery upload below.`
          : "Camera unavailable. Use manual entry or gallery upload below.",
      );
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBarcodeResolved = useCallback(
    async (code: string) => {
      setBarcodeStatus("loading");
      setNotFoundBarcode(null);
      const result: BarcodeLookupResult = await findFoodByBarcode(code);
      if (result.status === "found") {
        setBarcodeStatus("idle");
        setActiveFood(result.food);
      } else if (result.status === "not_found") {
        setBarcodeStatus("not_found");
        setNotFoundBarcode(result.barcode);
      } else {
        setBarcodeStatus("error");
      }
    },
    [findFoodByBarcode],
  );

  // Live detection using the native BarcodeDetector API when the browser
  // supports it (Chromium-based browsers). Falls back silently otherwise —
  // manual entry and the simulate button remain fully functional.
  useEffect(() => {
    if (mode !== "barcode" || !isCameraReady) return undefined;

    type DetectorWindow = Window & {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
      };
    };
    const detectorWindow = window as DetectorWindow;
    if (!detectorWindow.BarcodeDetector) return undefined;

    const detector = new detectorWindow.BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    detectIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const results = await detector.detect(canvas);
        if (results.length > 0 && barcodeStatus !== "loading") {
          void handleBarcodeResolved(results[0].rawValue);
        }
      } catch {
        // Ignore transient detection errors from a single frame.
      }
    }, 700);

    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    };
  }, [mode, isCameraReady, barcodeStatus, handleBarcodeResolved]);

  const handleSimulateScan = () => {
    const code = DEMO_BARCODES[Math.floor(Math.random() * DEMO_BARCODES.length)];
    void handleBarcodeResolved(code);
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim().length < 6) {
      setBarcodeStatus("error");
      return;
    }
    void handleBarcodeResolved(manualBarcode.trim());
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      void vision.analyzeFile(file);
    }, "image/jpeg", 0.9);
  };

  const handleGalleryPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void vision.analyzeFile(file);
    event.target.value = "";
  };

  const handleConfirmLog = async (payload: {
    servingUnit: ServingUnit;
    servingAmount: number;
    mealType: MealType;
  }) => {
    if (!activeFood) return;
    await logMealItem({
      foodItem: activeFood,
      loggedServing: { unit: payload.servingUnit, amount: payload.servingAmount },
      mealType: payload.mealType,
    });
    setLastLogged(activeFood.name);
    setActiveFood(null);
    vision.reset();
    setBarcodeStatus("idle");
    setNotFoundBarcode(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-900 px-5 py-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
        >
          ← Dashboard
        </button>
        <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Scan Food</h1>
        <span className="w-20" />
      </header>

      <div className="flex gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={() => setMode("barcode")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
            mode === "barcode"
              ? "border-sky-500 bg-sky-500/15 text-sky-300"
              : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
          }`}
        >
          <Barcode size={16} /> Barcode
        </button>
        <button
          type="button"
          onClick={() => setMode("vision")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
            mode === "vision"
              ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
              : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
          }`}
        >
          <Sparkles size={16} /> AI Photo
        </button>
      </div>

      <div className="relative mx-5 mt-5 aspect-[3/4] overflow-hidden rounded-3xl border border-zinc-800 bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {!isCameraReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 px-6 text-center">
            <Camera size={32} className="text-zinc-600" />
            <p className="text-sm text-zinc-400">{cameraError ?? "Requesting camera access…"}</p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`relative h-56 w-56 rounded-2xl border-2 ${
              mode === "barcode" ? "border-sky-400/70" : "border-emerald-400/70"
            }`}
          >
            <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-2xl border-l-4 border-t-4 border-white" />
            <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-2xl border-r-4 border-t-4 border-white" />
            <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-2xl border-b-4 border-l-4 border-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-2xl border-b-4 border-r-4 border-white" />
            {isCameraReady && (
              <div
                className={`absolute left-1 right-1 h-0.5 animate-[scan_2.2s_ease-in-out_infinite] ${
                  mode === "barcode" ? "bg-sky-400" : "bg-emerald-400"
                }`}
              />
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <p className="rounded-full bg-black/60 px-4 py-1.5 text-xs text-zinc-300">
            {mode === "barcode"
              ? "Align the barcode within the frame"
              : "Center your meal within the frame"}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 8%;
          }
          50% {
            top: 88%;
          }
          100% {
            top: 8%;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 px-5 py-5">
        {mode === "barcode" ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={manualBarcode}
                onChange={(event) => setManualBarcode(event.target.value)}
                placeholder="Enter barcode manually"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
              />
              <button
                type="button"
                onClick={handleManualSubmit}
                className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400"
              >
                Lookup
              </button>
            </div>
            <button
              type="button"
              onClick={handleSimulateScan}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
            >
              <ScanLine size={16} />
              Simulate Scan (demo)
            </button>

            {barcodeStatus === "loading" && (
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 size={16} className="animate-spin" /> Looking up product…
              </p>
            )}
            {barcodeStatus === "error" && (
              <p className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                <AlertTriangle size={16} /> Enter a valid barcode (6+ digits).
              </p>
            )}
            {barcodeStatus === "not_found" && notFoundBarcode && (
              <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <p className="flex items-center gap-2 text-sm text-amber-300">
                  <AlertTriangle size={16} /> Product not found for barcode {notFoundBarcode}.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCustomFoodModal(true)}
                  className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
                >
                  Create Custom Food
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={!isCameraReady || vision.status === "analyzing" || vision.status === "reading"}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera size={18} /> Capture
              </button>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700">
                <ImageIcon size={18} /> Gallery
                <input type="file" accept="image/*" className="hidden" onChange={handleGalleryPick} />
              </label>
            </div>

            {(vision.status === "reading" || vision.status === "analyzing") && (
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 size={16} className="animate-spin" />
                {vision.status === "reading" ? "Reading image…" : "Analyzing meal with vision AI…"}
              </p>
            )}
            {vision.status === "error" && (
              <p className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                <AlertTriangle size={16} /> {vision.error}
              </p>
            )}
            {vision.status === "success" && vision.suggestedFood && (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <p className="flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 size={16} />
                  Detected <strong>{vision.suggestedFood.name}</strong> (
                  {Math.round((vision.confidence ?? 0) * 100)}% confidence)
                </p>
                <button
                  type="button"
                  onClick={() => setActiveFood(vision.suggestedFood)}
                  className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Review & Log
                </button>
              </div>
            )}
          </div>
        )}

        {lastLogged && (
          <p className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-300">
            <CheckCircle2 size={16} /> Logged {lastLogged}. Scan another item or return to the dashboard.
          </p>
        )}
      </div>

      {activeFood && (
        <ServingSizeSelectorModal
          foodItem={activeFood}
          onClose={() => setActiveFood(null)}
          onConfirm={handleConfirmLog}
        />
      )}

      {showCustomFoodModal && notFoundBarcode && (
        <CustomFoodCreatorModal
          initialBarcode={notFoundBarcode}
          onClose={() => setShowCustomFoodModal(false)}
          onCreated={(food) => {
            setShowCustomFoodModal(false);
            setBarcodeStatus("idle");
            setNotFoundBarcode(null);
            setActiveFood(food);
          }}
        />
      )}
    </div>
  );
}
