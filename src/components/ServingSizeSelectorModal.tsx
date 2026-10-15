"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Droplets, Flame, Loader2, Minus, Plus, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { FoodItem, MealType, ServingUnit } from "@/lib/food/schemas";
import { MEAL_TYPES } from "@/lib/food/schemas";
import { computeMacrosForServing } from "@/lib/food/nutrition";
import { MEAL_TYPE_LABELS } from "@/lib/food/theme";
import { useFoodStore } from "@/store/useFoodStore";

interface ServingSizeSelectorModalProps {
  foodItem: FoodItem;
  initialMealType?: MealType;
  initialServingUnit?: ServingUnit;
  initialServingAmount?: number;
  isEditing?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    servingUnit: ServingUnit;
    servingAmount: number;
    mealType: MealType;
  }) => Promise<void>;
}

type CookedConversionMode = "raw" | "pasta_rice" | "meat_fish" | "family_pot";

const PRESET_GRAMS = [5, 10, 50, 80, 100, 150, 200];

const EVO_OIL_FOOD_ITEM: FoodItem = {
  id: "ita-olio-evo",
  name: "Olio Extravergine d'Oliva (EVO)",
  brand: "Condimento",
  macrosPer100g: {
    calories: 899,
    protein: 0,
    carbs: 0,
    fat: 99.9,
  },
  defaultServing: { unit: "g", amount: 10 },
  isCustom: false,
};

export function ServingSizeSelectorModal({
  foodItem,
  initialMealType = "snack",
  initialServingUnit,
  initialServingAmount,
  isEditing = false,
  onClose,
  onConfirm,
}: ServingSizeSelectorModalProps) {
  const logMealItem = useFoodStore((state) => state.logMealItem);

  const [servingUnit, setServingUnit] = useState<ServingUnit>(
    initialServingUnit ?? foodItem.defaultServing.unit
  );
  const [servingAmount, setServingAmount] = useState<number>(
    initialServingAmount ?? foodItem.defaultServing.amount
  );
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [cookedMode, setCookedMode] = useState<CookedConversionMode>("raw");

  // Stato Calcolatore Pentola Famiglia
  const [potTotalRaw, setPotTotalRaw] = useState<number>(320);
  const [potTotalCooked, setPotTotalCooked] = useState<number>(720);

  // Stato Giro d'Olio EVO 1-Tap (0g, 5g cucchiaino, 10g cucchiaio)
  const [extraOilGrams, setExtraOilGrams] = useState<number>(0);

  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  // Calcola i grammi equivalenti a crudo
  const effectiveAmount = useMemo(() => {
    if (!Number.isFinite(servingAmount) || servingAmount <= 0) return 0;
    if (servingUnit !== "g" || cookedMode === "raw") return servingAmount;
    if (cookedMode === "pasta_rice") {
      return Math.round(servingAmount / 2.3);
    }
    if (cookedMode === "meat_fish") {
      return Math.round(servingAmount / 0.75);
    }
    if (cookedMode === "family_pot") {
      if (potTotalCooked <= 0 || potTotalRaw <= 0) return servingAmount;
      return Math.round((servingAmount / potTotalCooked) * potTotalRaw);
    }
    return servingAmount;
  }, [servingAmount, servingUnit, cookedMode, potTotalRaw, potTotalCooked]);

  const previewMacros = useMemo(() => {
    const base =
      effectiveAmount <= 0
        ? { calories: 0, protein: 0, carbs: 0, fat: 0 }
        : computeMacrosForServing(foodItem, {
            unit: servingUnit,
            amount: effectiveAmount,
          });

    if (extraOilGrams > 0) {
      const oilKcal = Math.round((899 * extraOilGrams) / 100);
      const oilFat = Number(((99.9 * extraOilGrams) / 100).toFixed(1));
      return {
        calories: base.calories + oilKcal,
        protein: base.protein,
        carbs: base.carbs,
        fat: Number((base.fat + oilFat).toFixed(1)),
      };
    }
    return base;
  }, [foodItem, servingUnit, effectiveAmount, extraOilGrams]);

  const macroCalorieSplit = useMemo(() => {
    const pKcal = previewMacros.protein * 4;
    const cKcal = previewMacros.carbs * 4;
    const fKcal = previewMacros.fat * 9;
    const total = pKcal + cKcal + fKcal || 1;
    return {
      p: Math.round((pKcal / total) * 100),
      c: Math.round((cKcal / total) * 100),
      f: Math.round((fKcal / total) * 100),
    };
  }, [previewMacros]);

  const stepAmount = (delta: number) => {
    const step = servingUnit === "portion" ? delta / 20 : delta;
    setServingAmount((prev) =>
      Math.max(0, Number(((Number(prev) || 0) + step).toFixed(1)))
    );
  };

  const handleConfirm = async () => {
    if (effectiveAmount <= 0) {
      setError("Inserisci una quantità maggiore di zero");
      return;
    }
    setError(null);
    setIsConfirming(true);
    try {
      await onConfirm({
        servingUnit,
        servingAmount: effectiveAmount,
        mealType,
      });

      if (extraOilGrams > 0) {
        await logMealItem({
          foodItem: EVO_OIL_FOOD_ITEM,
          loggedServing: { unit: "g", amount: extraOilGrams },
          mealType,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di salvataggio");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      title={foodItem.name}
      subtitle={
        isEditing
          ? "Modifica la quantità o sposta in un altro pasto"
          : foodItem.brand
          ? `${foodItem.brand} • Regola quantità`
          : "Regola la porzione"
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {/* Segmented Control Unità */}
        <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-[#161A26] p-1">
          {(["g", "ml", "portion"] as ServingUnit[]).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => {
                setServingUnit(unit);
                if (unit !== "g") setCookedMode("raw");
              }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition ${
                servingUnit === unit
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {unit === "portion" ? "Porzione" : unit}
            </button>
          ))}
        </div>

        {/* Hero Stepper Quantità */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => stepAmount(-10)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#161A26] text-slate-300 transition hover:border-emerald-500/40 hover:text-white active:scale-95"
            >
              <Minus size={18} />
            </button>

            <div className="flex items-baseline justify-center">
              <input
                ref={inputRef}
                type="number"
                min={0}
                step={servingUnit === "portion" ? 0.5 : 1}
                value={Number.isFinite(servingAmount) ? servingAmount : ""}
                onChange={(e) => setServingAmount(e.target.valueAsNumber)}
                className="font-display w-32 border-b-2 border-white/10 bg-transparent pb-1 text-center text-4xl font-bold text-white outline-none transition focus:border-emerald-400"
              />
              <span className="ml-1 text-sm font-bold uppercase text-slate-400">
                {servingUnit === "portion" ? "porz" : servingUnit}
              </span>
            </div>

            <button
              type="button"
              onClick={() => stepAmount(10)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#161A26] text-slate-300 transition hover:border-emerald-500/40 hover:text-white active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Preset Rapidi */}
          {servingUnit !== "portion" && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {PRESET_GRAMS.map((preset) => {
                const label =
                  preset === 5 && servingUnit === "g"
                    ? "5g (1 cucchiaino)"
                    : preset === 10 && servingUnit === "g"
                    ? "10g (1 cucchiaio)"
                    : `${preset}${servingUnit}`;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setServingAmount(preset)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums transition ${
                      servingAmount === preset
                        ? "border border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "bg-[#161A26] text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Convertitore Intelligente Peso Crudo / Cotto + Pentola Famiglia */}
          {servingUnit === "g" && (
            <div className="mt-3.5 w-full rounded-2xl border border-white/[0.06] bg-[#161A26]/70 p-2.5">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  <Flame size={12} /> Conversione Crudo / Cotto
                </span>
                {cookedMode !== "raw" && (
                  <span className="text-[11px] font-bold text-emerald-400 tabular-nums">
                    ≈ {effectiveAmount}g a crudo
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  { id: "raw", label: "Già a crudo" },
                  { id: "pasta_rice", label: "Pasta/Riso cotto" },
                  { id: "meat_fish", label: "Carne/Pesce cotto" },
                  { id: "family_pot", label: "Pentola famiglia" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      setCookedMode(mode.id as CookedConversionMode)
                    }
                    className={`rounded-xl py-1.5 px-2 text-[11px] font-bold transition ${
                      cookedMode === mode.id
                        ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                        : "bg-[#12151E] text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {cookedMode === "family_pot" && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-2.5 text-left">
                  <div className="rounded-xl bg-[#12151E] p-2">
                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Users size={11} className="text-amber-400" /> Pentola Tot. Crudo (g)
                    </label>
                    <input
                      type="number"
                      value={potTotalRaw}
                      onChange={(e) => setPotTotalRaw(Number(e.target.value))}
                      className="mt-0.5 w-full bg-transparent font-display text-sm font-extrabold text-white outline-none tabular-nums"
                    />
                  </div>
                  <div className="rounded-xl bg-[#12151E] p-2">
                    <label className="block text-[10px] font-bold text-slate-400">
                      Pentola Tot. Cotto (g)
                    </label>
                    <input
                      type="number"
                      value={potTotalCooked}
                      onChange={(e) => setPotTotalCooked(Number(e.target.value))}
                      className="mt-0.5 w-full bg-transparent font-display text-sm font-extrabold text-white outline-none tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Giro d'Olio EVO 1-Tap (Feature Made for Italy) */}
          {!isEditing && (
            <div className="mt-2.5 flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-[#161A26]/70 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                <Droplets size={13} className="text-amber-400" /> + Giro d&apos;Olio EVO:
              </span>
              <div className="flex gap-1.5">
                {[
                  { g: 0, label: "No" },
                  { g: 5, label: "+5g (45 kcal)" },
                  { g: 10, label: "+10g (90 kcal)" },
                ].map((opt) => (
                  <button
                    key={opt.g}
                    type="button"
                    onClick={() => setExtraOilGrams(opt.g)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                      extraOilGrams === opt.g
                        ? "bg-amber-500 text-slate-950"
                        : "bg-[#12151E] text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Riepilogo Kcal + Barra Proporzione Macro */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#161A26] p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Apporto Nutrizionale
            </span>
            <span className="font-display text-2xl font-bold text-white tabular-nums">
              {Math.round(previewMacros.calories)}{" "}
              <span className="text-xs font-semibold text-slate-400">kcal</span>
            </span>
          </div>

          <div className="my-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="bg-cyan-400 transition-all"
              style={{ width: `${macroCalorieSplit.p}%` }}
            />
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${macroCalorieSplit.c}%` }}
            />
            <div
              className="bg-rose-400 transition-all"
              style={{ width: `${macroCalorieSplit.f}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
            <div className="rounded-xl bg-[#12151E] p-2">
              <span className="block text-[11px] font-bold uppercase text-cyan-400">
                Proteine ({macroCalorieSplit.p}%)
              </span>
              <span className="font-display text-sm font-bold text-white">
                {previewMacros.protein}g
              </span>
            </div>
            <div className="rounded-xl bg-[#12151E] p-2">
              <span className="block text-[11px] font-bold uppercase text-amber-400">
                Carbo ({macroCalorieSplit.c}%)
              </span>
              <span className="font-display text-sm font-bold text-white">
                {previewMacros.carbs}g
              </span>
            </div>
            <div className="rounded-xl bg-[#12151E] p-2">
              <span className="block text-[11px] font-bold uppercase text-rose-400">
                Grassi ({macroCalorieSplit.f}%)
              </span>
              <span className="font-display text-sm font-bold text-white">
                {previewMacros.fat}g
              </span>
            </div>
          </div>
        </div>

        {/* Scelta Pasto */}
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Destinazione Pasto
          </span>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                  mealType === type
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                    : "border-white/[0.06] bg-[#161A26] text-slate-400 hover:text-white"
                }`}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-sm font-extrabold text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        >
          {isConfirming ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Check size={18} strokeWidth={3} />
          )}
          {isEditing
            ? `Aggiorna in ${MEAL_TYPE_LABELS[mealType]}`
            : `Registra in ${MEAL_TYPE_LABELS[mealType]}`}
        </button>
      </div>
    </Modal>
  );
}