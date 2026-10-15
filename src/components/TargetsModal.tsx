"use client";

import React, { useState, useMemo } from "react";
import type { DailyTarget } from "@/lib/food/schemas";
import {
  X,
  Calculator,
  Sliders,
  Dumbbell,
  Moon,
  Check,
  Sparkles,
  Flame,
} from "lucide-react";
import { triggerHaptic } from "@/lib/mobileUtils";

export interface MacroCyclingConfig {
  enabled: boolean;
  activeDayType: "on" | "off";
  onDay: DailyTarget;
  offDay: DailyTarget;
}

interface TargetsModalProps {
  isOpen: boolean;
  currentTarget: DailyTarget;
  cyclingConfig: MacroCyclingConfig;
  onClose: () => void;
  onSave: (newTarget: DailyTarget, newCycling: MacroCyclingConfig) => void;
}

type ModalTab = "manual" | "calculator";
type GoalPreset = "cut" | "maintain" | "bulk";
type Gender = "male" | "female";

export function TargetsModal({
  isOpen,
  currentTarget,
  cyclingConfig,
  onClose,
  onSave,
}: TargetsModalProps) {
  const [tab, setTab] = useState<ModalTab>("manual");

  // Stato Manuale & Macro Cycling
  const [cyclingEnabled, setCyclingEnabled] = useState<boolean>(
    cyclingConfig.enabled
  );
  const [editingDayType, setEditingDayType] = useState<"on" | "off">(
    cyclingConfig.activeDayType
  );
  const [onTarget, setOnTarget] = useState<DailyTarget>(
    cyclingConfig.onDay ?? currentTarget
  );
  const [offTarget, setOffTarget] = useState<DailyTarget>(
    cyclingConfig.offDay ?? {
      calories: Math.max(1200, currentTarget.calories - 300),
      protein: currentTarget.protein,
      carbs: Math.max(50, currentTarget.carbs - 65),
      fat: currentTarget.fat + 5,
    }
  );

  // Stato Calcolatore TDEE (Mifflin-St Jeor)
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<number>(23);
  const [weightKg, setWeightKg] = useState<number>(74);
  const [heightCm, setHeightCm] = useState<number>(178);
  const [activityMultiplier, setActivityMultiplier] = useState<number>(1.55);
  const [goalPreset, setGoalPreset] = useState<GoalPreset>("maintain");
  const [proteinPerKg, setProteinPerKg] = useState<number>(2.0);

  const activeEditedTarget = cyclingEnabled
    ? editingDayType === "on"
      ? onTarget
      : offTarget
    : onTarget;

  const updateActiveField = (field: keyof DailyTarget, val: number) => {
    const clean = Math.max(0, Math.round(Number(val) || 0));
    if (!cyclingEnabled || editingDayType === "on") {
      setOnTarget((prev) => ({ ...prev, [field]: clean }));
    } else {
      setOffTarget((prev) => ({ ...prev, [field]: clean }));
    }
  };

  // Ricalcola le Kcal totali dai grammi di P/C/G
  const syncCaloriesFromMacros = () => {
    triggerHaptic("light");
    const t = activeEditedTarget;
    const kcal = Math.round(t.protein * 4 + t.carbs * 4 + t.fat * 9);
    updateActiveField("calories", kcal);
  };

  // Risultato del Calcolatore TDEE
  const calculatedResult = useMemo(() => {
    const bmr =
      gender === "male"
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

    const tdee = Math.round(bmr * activityMultiplier);
    const delta =
      goalPreset === "cut" ? -400 : goalPreset === "bulk" ? 280 : 0;
    const targetCalories = Math.max(1200, tdee + delta);

    const protein = Math.round(weightKg * proteinPerKg);
    const fat = Math.round(weightKg * 0.9);
    const remainingKcal = Math.max(
      200,
      targetCalories - protein * 4 - fat * 9
    );
    const carbs = Math.round(remainingKcal / 4);

    return {
      tdee,
      target: {
        calories: targetCalories,
        protein,
        carbs,
        fat,
      } as DailyTarget,
    };
  }, [gender, age, weightKg, heightCm, activityMultiplier, goalPreset, proteinPerKg]);

  if (!isOpen) return null;

  const handleApplyCalculator = () => {
    triggerHaptic("success");
    const base = calculatedResult.target;
    setOnTarget(base);
    setOffTarget({
      calories: Math.max(1200, base.calories - 280),
      protein: base.protein,
      carbs: Math.max(50, base.carbs - 70),
      fat: base.fat,
    });
    setTab("manual");
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("success");
    const finalActiveTarget = cyclingEnabled
      ? editingDayType === "on"
        ? onTarget
        : offTarget
      : onTarget;

    onSave(finalActiveTarget, {
      enabled: cyclingEnabled,
      activeDayType: editingDayType,
      onDay: onTarget,
      offDay: offTarget,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-[#11151F] p-6 text-slate-100 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
              <Flame size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Obiettivi & Macro Cycling
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Personalizza il tuo piano nutrizionale BoTrack
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selettore Tab: Manuale vs Calcolatore TDEE */}
        <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.06] bg-[#181D2B] p-1">
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition ${
              tab === "manual"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders size={14} /> Target & Cycling
          </button>
          <button
            type="button"
            onClick={() => setTab("calculator")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition ${
              tab === "calculator"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calculator size={14} /> Calcola TDEE
          </button>
        </div>

        {tab === "calculator" ? (
          <div className="space-y-4 text-xs">
            {/* Sesso & Parametri */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "male", label: "Uomo" },
                  { id: "female", label: "Donna" },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`rounded-2xl border py-2.5 font-bold transition ${
                    gender === g.id
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/[0.06] bg-[#181D2B] text-slate-400"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-white/[0.07] bg-[#181D2B] p-3">
                <label className="block text-[11px] font-bold text-slate-400">
                  Età (anni)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="mt-1 w-full bg-transparent font-display text-lg font-extrabold text-white outline-none tabular-nums"
                />
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#181D2B] p-3">
                <label className="block text-[11px] font-bold text-slate-400">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="mt-1 w-full bg-transparent font-display text-lg font-extrabold text-white outline-none tabular-nums"
                />
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#181D2B] p-3">
                <label className="block text-[11px] font-bold text-slate-400">
                  Altezza (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="mt-1 w-full bg-transparent font-display text-lg font-extrabold text-white outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Livello di Attività */}
            <div>
              <label className="mb-1.5 block font-bold text-slate-300">
                Stile di vita e Allenamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 1.35, label: "Leggero (6-8k passi)" },
                  { val: 1.55, label: "Attivo (10k passi + 3-4 wo)" },
                  { val: 1.72, label: "Intenso (5-6 wo / Calisthenics)" },
                  { val: 1.2, label: "Sedentario (<5k passi)" },
                ].map((act) => (
                  <button
                    key={act.val}
                    type="button"
                    onClick={() => setActivityMultiplier(act.val)}
                    className={`rounded-xl border px-3 py-2 text-left text-[11px] font-bold transition ${
                      activityMultiplier === act.val
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/[0.06] bg-[#181D2B] text-slate-400"
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fase / Obiettivo */}
            <div>
              <label className="mb-1.5 block font-bold text-slate-300">
                Obiettivo Fisico
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cut", label: "Definizione (-400)" },
                  { id: "maintain", label: "Ricomposizione" },
                  { id: "bulk", label: "Massa Pulita (+280)" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoalPreset(g.id as GoalPreset)}
                    className={`rounded-xl border py-2.5 text-[11px] font-extrabold transition ${
                      goalPreset === g.id
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/[0.06] bg-[#181D2B] text-slate-400"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quota Proteica g/kg */}
            <div>
              <div className="mb-1 flex justify-between">
                <span className="font-bold text-slate-300">
                  Target Proteico per kg di peso
                </span>
                <span className="font-extrabold text-cyan-400 tabular-nums">
                  {proteinPerKg.toFixed(1)} g/kg ({calculatedResult.target.protein}g)
                </span>
              </div>
              <input
                type="range"
                min={1.4}
                max={2.6}
                step={0.1}
                value={proteinPerKg}
                onChange={(e) => setProteinPerKg(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Card Risultato Calcolo */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                    TDEE Stimato: {calculatedResult.tdee} kcal
                  </span>
                  <p className="font-display mt-0.5 text-2xl font-black text-white tabular-nums">
                    {calculatedResult.target.calories} kcal{" "}
                    <span className="text-xs font-semibold text-slate-300">
                      / giorno
                    </span>
                  </p>
                </div>
                <Sparkles className="text-emerald-400" size={22} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold tabular-nums">
                <div className="rounded-xl bg-[#11151F]/80 py-2 text-cyan-400">
                  {calculatedResult.target.protein}g P
                </div>
                <div className="rounded-xl bg-[#11151F]/80 py-2 text-amber-400">
                  {calculatedResult.target.carbs}g C
                </div>
                <div className="rounded-xl bg-[#11151F]/80 py-2 text-rose-400">
                  {calculatedResult.target.fat}g G
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyCalculator}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 font-extrabold text-slate-950 transition hover:bg-emerald-400"
              >
                <Check size={16} strokeWidth={3} /> Applica questi valori
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
            {/* Toggle Macro Cycling ON / OFF */}
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#181D2B] px-4 py-3">
              <div>
                <span className="block font-extrabold text-white">
                  Macro Cycling (Giorni ON / OFF)
                </span>
                <span className="text-[11px] text-slate-400">
                  Differenzia calorie e carboidrati quando ti alleni
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCyclingEnabled((prev) => !prev)}
                className={`h-7 w-12 rounded-full p-1 transition ${
                  cyclingEnabled ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white transition-transform ${
                    cyclingEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {cyclingEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDayType("on")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-extrabold transition ${
                    editingDayType === "on"
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-white/[0.06] bg-[#181D2B] text-slate-400"
                  }`}
                >
                  <Dumbbell size={14} /> Giorno ON (Workout)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDayType("off")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-extrabold transition ${
                    editingDayType === "off"
                      ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                      : "border-white/[0.06] bg-[#181D2B] text-slate-400"
                  }`}
                >
                  <Moon size={14} /> Giorno OFF (Riposo)
                </button>
              </div>
            )}

            {/* Input Calorie e Macro */}
            <div className="rounded-2xl border border-emerald-500/25 bg-[#181D2B] p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Target Calorie Giornaliero
                </label>
                <button
                  type="button"
                  onClick={syncCaloriesFromMacros}
                  className="rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-slate-300 hover:text-white"
                >
                  Ricalcola da P/C/G
                </button>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <input
                  type="number"
                  value={activeEditedTarget.calories}
                  onChange={(e) =>
                    updateActiveField("calories", Number(e.target.value))
                  }
                  className="font-display w-full bg-transparent text-3xl font-black text-white outline-none tabular-nums"
                />
                <span className="text-sm font-bold text-slate-400">kcal</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] p-3">
                <label className="block text-[11px] font-extrabold uppercase text-cyan-400">
                  Proteine (g)
                </label>
                <input
                  type="number"
                  value={activeEditedTarget.protein}
                  onChange={(e) =>
                    updateActiveField("protein", Number(e.target.value))
                  }
                  className="mt-1 w-full bg-transparent font-display text-xl font-black text-white outline-none tabular-nums"
                />
                <span className="mt-1 block text-[11px] text-slate-400 tabular-nums">
                  {activeEditedTarget.protein * 4} kcal
                </span>
              </div>

              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
                <label className="block text-[11px] font-extrabold uppercase text-amber-400">
                  Carbo (g)
                </label>
                <input
                  type="number"
                  value={activeEditedTarget.carbs}
                  onChange={(e) =>
                    updateActiveField("carbs", Number(e.target.value))
                  }
                  className="mt-1 w-full bg-transparent font-display text-xl font-black text-white outline-none tabular-nums"
                />
                <span className="mt-1 block text-[11px] text-slate-400 tabular-nums">
                  {activeEditedTarget.carbs * 4} kcal
                </span>
              </div>

              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] p-3">
                <label className="block text-[11px] font-extrabold uppercase text-rose-400">
                  Grassi (g)
                </label>
                <input
                  type="number"
                  value={activeEditedTarget.fat}
                  onChange={(e) =>
                    updateActiveField("fat", Number(e.target.value))
                  }
                  className="mt-1 w-full bg-transparent font-display text-xl font-black text-white outline-none tabular-nums"
                />
                <span className="mt-1 block text-[11px] text-slate-400 tabular-nums">
                  {activeEditedTarget.fat * 9} kcal
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-2xl border border-white/10 bg-[#181D2B] px-5 font-bold text-slate-300 transition hover:bg-white/10"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-sm font-extrabold text-slate-950 shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition hover:brightness-110"
              >
                <Check size={18} strokeWidth={3} /> Salva Obiettivi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TargetsModal;