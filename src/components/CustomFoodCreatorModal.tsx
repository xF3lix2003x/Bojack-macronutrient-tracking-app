"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { CreateCustomFoodInput, FoodItem, ServingUnit } from "@/lib/food/schemas";
import { X, PlusCircle, Barcode, Check } from "lucide-react";

export interface CustomFoodCreatorModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onCreated?: (food: FoodItem) => void;
  onCreate?: (food: FoodItem) => void;
  onSave?: (food: FoodItem) => void;
  onSubmitFood?: (food: FoodItem) => void;
  initialBarcode?: string;
  defaultBarcode?: string;
  barcode?: string;
  initialName?: string;
  defaultName?: string;
  [key: string]: unknown;
}

const UNIT_OPTIONS: { value: ServingUnit; label: string }[] = [
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "pz", label: "pz" },
  { value: "portion", label: "Porz." },
];

export function CustomFoodCreatorModal({
  isOpen,
  open,
  onClose,
  onCreated,
  onCreate,
  onSave,
  onSubmitFood,
  initialBarcode,
  defaultBarcode,
  barcode,
  initialName,
  defaultName,
}: CustomFoodCreatorModalProps) {
  const [isClosedInternally, setIsClosedInternally] = useState(false);

  const externalOpen = isOpen ?? open ?? true;
  const resolvedBarcode = initialBarcode ?? defaultBarcode ?? barcode ?? undefined;
  const resolvedName = initialName ?? defaultName ?? "";

  useEffect(() => {
    if (isOpen === true || open === true) {
      setIsClosedInternally(false);
    }
  }, [isOpen, open]);

  const handleClose = () => {
    setIsClosedInternally(true);
    onClose?.();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [watched, setWatched] = useState<CreateCustomFoodInput>({
    name: resolvedName,
    brand: undefined,
    barcode: resolvedBarcode,
    servingUnit: "g",
    servingAmount: 100,
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
  });

  useEffect(() => {
    setWatched((prev) => ({
      ...prev,
      name: resolvedName || prev.name,
      barcode: resolvedBarcode ?? prev.barcode,
    }));
  }, [resolvedBarcode, resolvedName]);

  const previewGrams = useMemo(() => {
    if ((watched.servingUnit as string) === "portion") return 100;
    return Number.isFinite(watched.servingAmount) ? Number(watched.servingAmount) : 0;
  }, [watched.servingUnit, watched.servingAmount]);

  const previewMacros = useMemo(() => {
    const factor = previewGrams / 100;
    return {
      calories: Math.round((Number(watched.caloriesPer100g) || 0) * factor),
      protein: Number(((Number(watched.proteinPer100g) || 0) * factor).toFixed(1)),
      carbs: Number(((Number(watched.carbsPer100g) || 0) * factor).toFixed(1)),
      fat: Number(((Number(watched.fatPer100g) || 0) * factor).toFixed(1)),
    };
  }, [watched, previewGrams]);

  if (!externalOpen || isClosedInternally) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watched.name.trim()) return;

    const newFood: FoodItem = {
      id: `custom-${Date.now()}`,
      name: watched.name.trim(),
      brand: watched.brand?.trim() || undefined,
      barcode: watched.barcode?.trim() || undefined,
      macrosPer100g: {
        calories: Number(watched.caloriesPer100g) || 0,
        protein: Number(watched.proteinPer100g) || 0,
        carbs: Number(watched.carbsPer100g) || 0,
        fat: Number(watched.fatPer100g) || 0,
      },
      defaultServing: {
        unit: watched.servingUnit as ServingUnit,
        amount: Number(watched.servingAmount) || 100,
      },
      isCustom: true,
    };

    try {
      onCreated?.(newFood);
      onCreate?.(newFood);
      onSave?.(newFood);
      onSubmitFood?.(newFood);
    } finally {
      handleClose();
    }
  };

  const noSpinnerClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  const baseInputClass = `h-10 w-full rounded-2xl border border-white/[0.08] bg-[#181D2B] px-3.5 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 tabular-nums ${noSpinnerClass}`;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-[#11151F] p-5 text-slate-100 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:rounded-3xl"
      >
        {/* Header compatto */}
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Nuovo Alimento Custom
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                Salva nel tuo database personale BoTrack
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-300"
            aria-label="Chiudi modale"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-300">
              Nome alimento *
            </label>
            <input
              type="text"
              required
              value={watched.name}
              onChange={(e) => setWatched({ ...watched, name: e.target.value })}
              className={baseInputClass}
              placeholder="Es. Yogurt Greco 0%, Crema Proteica..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-400">
                Marca (opzionale)
              </label>
              <input
                type="text"
                value={watched.brand ?? ""}
                onChange={(e) =>
                  setWatched({ ...watched, brand: e.target.value || undefined })
                }
                placeholder="Es. Fage, Prozis..."
                className={baseInputClass}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-400">
                <Barcode size={13} className="text-emerald-400" /> Barcode EAN
              </label>
              <input
                type="text"
                value={watched.barcode ?? ""}
                onChange={(e) =>
                  setWatched({ ...watched, barcode: e.target.value || undefined })
                }
                placeholder="Opzionale"
                className={baseInputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2.5">
            <div className="col-span-7">
              <label className="mb-1 block text-xs font-bold text-slate-300">
                Unità predefinita
              </label>
              <div className="grid h-10 grid-cols-4 gap-1 rounded-2xl border border-white/[0.06] bg-[#181D2B] p-1">
                {UNIT_OPTIONS.map((u) => {
                  const active = watched.servingUnit === u.value;
                  return (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() =>
                        setWatched({ ...watched, servingUnit: u.value })
                      }
                      className={`rounded-xl text-xs font-extrabold transition ${
                        active
                          ? "bg-emerald-500 text-slate-950 shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {u.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="col-span-5">
              <label className="mb-1 block truncate text-xs font-bold text-slate-300">
                Porzione ({watched.servingUnit})
              </label>
              <input
                type="number"
                step="any"
                value={watched.servingAmount}
                onChange={(e) =>
                  setWatched({
                    ...watched,
                    servingAmount: Number(e.target.value),
                  })
                }
                onFocus={(e) => e.target.select()}
                className={baseInputClass}
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Valori Nutrizionali per 100g / 100ml
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-white/[0.08] bg-[#181D2B]/80 px-3.5 py-2.5 transition focus-within:border-emerald-500/60">
                <label className="block text-[11px] font-extrabold uppercase text-emerald-400">
                  Calorie (kcal)
                </label>
                <input
                  type="number"
                  step="any"
                  value={watched.caloriesPer100g}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setWatched({
                      ...watched,
                      caloriesPer100g: Number(e.target.value),
                    })
                  }
                  className={`mt-0.5 w-full bg-transparent font-display text-xl font-black text-white outline-none tabular-nums ${noSpinnerClass}`}
                />
              </div>

              <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] px-3.5 py-2.5 transition focus-within:border-cyan-400">
                <label className="block text-[11px] font-extrabold uppercase text-cyan-400">
                  Proteine (g)
                </label>
                <input
                  type="number"
                  step="any"
                  value={watched.proteinPer100g}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setWatched({
                      ...watched,
                      proteinPer100g: Number(e.target.value),
                    })
                  }
                  className={`mt-0.5 w-full bg-transparent font-display text-xl font-black text-white outline-none tabular-nums ${noSpinnerClass}`}
                />
              </div>

              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-2.5 transition focus-within:border-amber-400">
                <label className="block text-[11px] font-extrabold uppercase text-amber-400">
                  Carboidrati (g)
                </label>
                <input
                  type="number"
                  step="any"
                  value={watched.carbsPer100g}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setWatched({
                      ...watched,
                      carbsPer100g: Number(e.target.value),
                    })
                  }
                  className={`mt-0.5 w-full bg-transparent font-display text-xl font-black text-white outline-none tabular-nums ${noSpinnerClass}`}
                />
              </div>

              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] px-3.5 py-2.5 transition focus-within:border-rose-400">
                <label className="block text-[11px] font-extrabold uppercase text-rose-400">
                  Grassi (g)
                </label>
                <input
                  type="number"
                  step="any"
                  value={watched.fatPer100g}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setWatched({
                      ...watched,
                      fatPer100g: Number(e.target.value),
                    })
                  }
                  className={`mt-0.5 w-full bg-transparent font-display text-xl font-black text-white outline-none tabular-nums ${noSpinnerClass}`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#181D2B] px-4 py-2.5">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Anteprima Porzione ({previewGrams}g)
              </span>
              <div className="mt-0.5 flex items-center gap-3 text-xs font-bold tabular-nums">
                <span className="text-cyan-400">{previewMacros.protein}g P</span>
                <span className="text-amber-400">{previewMacros.carbs}g C</span>
                <span className="text-rose-400">{previewMacros.fat}g G</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display text-xl font-black text-emerald-400 tabular-nums">
                {previewMacros.calories}
              </span>
              <span className="ml-1 text-xs font-bold text-slate-400">kcal</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="h-11 rounded-2xl border border-white/10 bg-[#181D2B] px-5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-sm font-extrabold text-slate-950 shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition hover:brightness-110 active:scale-[0.99]"
            >
              <Check size={17} strokeWidth={3} />
              Salva in BoTrack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomFoodCreatorModal;