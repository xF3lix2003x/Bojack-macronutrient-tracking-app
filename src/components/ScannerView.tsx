"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Barcode,
  Camera,
  ImagePlus,
  Keyboard,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useFoodVisionCapture } from "@/hooks/useFoodVisionCapture";
import { useFoodStore } from "@/store/useFoodStore";
import { ServingSizeSelectorModal } from "@/components/ServingSizeSelectorModal";
import { CustomFoodCreatorModal } from "@/components/CustomFoodCreatorModal";
import type { FoodItem, MealType, ServingUnit } from "@/lib/food/schemas";
import { triggerHaptic } from "@/lib/mobileUtils";

type ScanMode = "barcode" | "vision";

export function ScannerView() {
  const router = useRouter();
  const findFoodByBarcode = useFoodStore((state) => state.findFoodByBarcode);
  const logMealItem = useFoodStore((state) => state.logMealItem);
  const hydrate = useFoodStore((state) => state.hydrate);

  const [mode, setMode] = useState<ScanMode>("barcode");
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);

  const [detectedFood, setDetectedFood] = useState<FoodItem | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScannedCodeRef = useRef<string | null>(null);

  const {
    videoRef,
    isStreaming,
    isAnalyzing: isVisionAnalyzing,
    error: cameraError,
    startCamera,
    stopCamera,
    captureAndAnalyze,
  } = useFoodVisionCapture();

  useEffect(() => {
    void hydrate();
    void startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBarcodeLookup = useCallback(
    async (codeToLookup: string) => {
      const clean = codeToLookup.trim();
      if (!clean || isLookingUpBarcode) return;

      triggerHaptic("light");
      setIsLookingUpBarcode(true);
      setStatusMessage(`Ricerca codice ${clean} nei database...`);

      try {
        const result = await findFoodByBarcode(clean);
        if (result.status === "found") {
          triggerHaptic("success");
          setStatusMessage(null);
          setDetectedFood(result.food);
        } else if (result.status === "not_found") {
          triggerHaptic("error");
          setStatusMessage(null);
          setNotFoundBarcode(clean);
        } else {
          setStatusMessage(result.message);
        }
      } finally {
        setIsLookingUpBarcode(false);
      }
    },
    [findFoodByBarcode, isLookingUpBarcode]
  );

  // Decodifica Live Automatica Barcode sul flusso video (API nativa BarcodeDetector)
  useEffect(() => {
    if (
      mode !== "barcode" ||
      !isStreaming ||
      Boolean(detectedFood) ||
      Boolean(notFoundBarcode) ||
      isLookingUpBarcode
    ) {
      return;
    }

    const BarcodeDetectorApi = (window as unknown as Record<string, any>)
      .BarcodeDetector;
    if (!BarcodeDetectorApi) return;

    let detector: any = null;
    try {
      detector = new BarcodeDetectorApi({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
    } catch {
      return;
    }

    let isCancelled = false;
    const interval = setInterval(async () => {
      const videoEl = videoRef.current;
      if (!videoEl || videoEl.readyState < 2 || isCancelled) return;
      try {
        const barcodes = await detector.detect(videoEl);
        if (Array.isArray(barcodes) && barcodes.length > 0) {
          const rawValue = String(barcodes[0]?.rawValue ?? "").trim();
          if (rawValue && rawValue !== lastScannedCodeRef.current) {
            lastScannedCodeRef.current = rawValue;
            void handleBarcodeLookup(rawValue);
            setTimeout(() => {
              lastScannedCodeRef.current = null;
            }, 3500);
          }
        }
      } catch {
        // Ignora frame non validi
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [
    mode,
    isStreaming,
    detectedFood,
    notFoundBarcode,
    isLookingUpBarcode,
    videoRef,
    handleBarcodeLookup,
  ]);

  const handleVisionCapture = async () => {
    triggerHaptic("medium");
    setStatusMessage("Analisi AI del piatto in corso...");
    const result = await captureAndAnalyze();
    if (result) {
      triggerHaptic("success");
      setStatusMessage(null);
      setDetectedFood(result.suggestedFood);
    } else {
      setStatusMessage(
        "Impossibile analizzare l'immagine. Riprova o carica una foto."
      );
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingUpload(true);
    setStatusMessage("Lettura foto con Gemini Vision...");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Errore lettura file"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) throw new Error("Errore durante l'analisi della foto");
      const data = (await res.json()) as { suggestedFood: FoodItem };
      triggerHaptic("success");
      setStatusMessage(null);
      setDetectedFood(data.suggestedFood);
    } catch {
      setStatusMessage("Errore durante l'analisi della foto dalla galleria.");
    } finally {
      setIsAnalyzingUpload(false);
      e.target.value = "";
    }
  };

  const handleConfirmServing = async (payload: {
    servingUnit: ServingUnit;
    servingAmount: number;
    mealType: MealType;
  }) => {
    if (!detectedFood) return;
    await logMealItem({
      foodItem: detectedFood,
      loggedServing: {
        unit: payload.servingUnit,
        amount: payload.servingAmount,
      },
      mealType: payload.mealType,
    });
    setDetectedFood(null);
    router.push("/");
  };

  const isBusy = isVisionAnalyzing || isAnalyzingUpload || isLookingUpBarcode;

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-[#080A0F] text-white">
      {/* Top Floating Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-5">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            router.push("/");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#11151F]/85 text-slate-200 backdrop-blur-xl transition hover:text-white"
          aria-label="Torna al Diario"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#11151F]/85 px-3.5 py-1.5 text-xs font-bold backdrop-blur-xl">
          <span
            className={`h-2 w-2 rounded-full ${
              isStreaming ? "animate-pulse bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span>
            {mode === "barcode" ? "Scanner Barcode Live" : "BoTrack AI Vision"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowManualInput((prev) => !prev)}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur-xl transition ${
            showManualInput
              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
              : "border-white/10 bg-[#11151F]/85 text-slate-300 hover:text-white"
          }`}
          title="Digita codice a barre"
        >
          <Keyboard size={18} />
        </button>
      </header>

      {/* Area Centrale Fotocamera + Mirino Adattivo */}
      <div className="relative mx-auto my-4 flex w-full max-w-md flex-1 flex-col items-center justify-center px-5">
        <div className="relative flex h-[440px] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#11151F] shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

          {/* Mirino Adattivo */}
          <div
            className={`pointer-events-none relative transition-all duration-300 ${
              mode === "barcode" ? "h-44 w-72" : "h-64 w-64"
            }`}
          >
            <div
              className={`absolute left-0 top-0 h-7 w-7 rounded-tl-2xl border-l-4 border-t-4 ${
                mode === "barcode" ? "border-emerald-400" : "border-purple-400"
              }`}
            />
            <div
              className={`absolute right-0 top-0 h-7 w-7 rounded-tr-2xl border-r-4 border-t-4 ${
                mode === "barcode" ? "border-emerald-400" : "border-purple-400"
              }`}
            />
            <div
              className={`absolute bottom-0 left-0 h-7 w-7 rounded-bl-2xl border-b-4 border-l-4 ${
                mode === "barcode" ? "border-emerald-400" : "border-purple-400"
              }`}
            />
            <div
              className={`absolute bottom-0 right-0 h-7 w-7 rounded-br-2xl border-b-4 border-r-4 ${
                mode === "barcode" ? "border-emerald-400" : "border-purple-400"
              }`}
            />

            <div
              className={`animate-scan-laser absolute left-3 right-3 h-0.5 rounded-full shadow-[0_0_12px_currentColor] ${
                mode === "barcode"
                  ? "bg-emerald-400 text-emerald-400"
                  : "bg-purple-400 text-purple-400"
              }`}
            />
          </div>

          {isBusy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080A0F]/80 backdrop-blur-md">
              <Loader2
                size={36}
                className={`animate-spin ${
                  mode === "vision" ? "text-purple-400" : "text-emerald-400"
                }`}
              />
              <p className="mt-3 text-sm font-bold text-white">
                {statusMessage ?? "Elaborazione in corso..."}
              </p>
              <span className="mt-1 text-xs text-slate-400">
                Calcolo calorie e macronutrienti per 100g
              </span>
            </div>
          )}

          {cameraError && !isStreaming && (
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-amber-500/30 bg-[#11151F]/95 p-3.5 text-center backdrop-blur-md">
              <p className="text-xs font-semibold text-amber-300">
                Fotocamera non attiva su questo dispositivo
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Carica una foto dalla Galleria o digita il codice EAN qui sotto.
              </p>
            </div>
          )}
        </div>

        {/* Cassetto A Scomparsa per Codice a Barre Manuale */}
        {showManualInput && (
          <div className="mt-3 flex w-full gap-2 rounded-2xl border border-white/10 bg-[#11151F] p-2.5 shadow-xl">
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Inserisci codice EAN (es. 8001120015018)..."
              className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-[#181D2B] px-3 text-xs font-medium text-white outline-none focus:border-emerald-500 tabular-nums"
            />
            <button
              type="button"
              disabled={isBusy || !manualBarcode.trim()}
              onClick={() => void handleBarcodeLookup(manualBarcode)}
              className="rounded-xl bg-emerald-500 px-4 text-xs font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
            >
              Cerca
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Sheet */}
      <div className="relative z-20 mx-auto w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#11151F]/95 px-5 pb-8 pt-4 backdrop-blur-xl">
        <div className="mb-4 flex gap-1.5 rounded-2xl border border-white/[0.06] bg-[#181D2B] p-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setMode("barcode");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              mode === "barcode"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Barcode size={16} /> Codice a Barre
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setMode("vision");
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              mode === "vision"
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={16} /> AI Foto Piatto
          </button>
        </div>

        {mode === "barcode" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setShowManualInput((prev) => !prev)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-sm font-extrabold text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition hover:brightness-110"
          >
            <Keyboard size={18} />{" "}
            {showManualInput
              ? "Nascondi Tastiera EAN"
              : "Inquadra il Barcode o Digita EAN"}
          </button>
        ) : (
          <div className="flex gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#181D2B] px-4 text-xs font-bold text-slate-200 transition hover:bg-white/10"
            >
              <ImagePlus size={18} className="text-purple-400" /> Galleria
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleVisionCapture()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition hover:brightness-110"
            >
              <Camera size={18} /> Scatta e Analizza con IA
            </button>
          </div>
        )}
      </div>

      {detectedFood && (
        <ServingSizeSelectorModal
          foodItem={detectedFood}
          initialMealType="snack"
          onClose={() => setDetectedFood(null)}
          onConfirm={handleConfirmServing}
        />
      )}

      {notFoundBarcode && (
        <CustomFoodCreatorModal
          initialBarcode={notFoundBarcode}
          onClose={() => setNotFoundBarcode(null)}
          onCreated={(food) => {
            setNotFoundBarcode(null);
            setDetectedFood(food);
          }}
        />
      )}
    </div>
  );
}