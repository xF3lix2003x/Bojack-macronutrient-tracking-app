"use client";

import React from "react";
import type { Macros, DailyTarget, MealEntry } from "@/lib/food/schemas";
import { Sparkles, TrendingUp } from "lucide-react";

interface MacroCoachCardProps {
  totals: Macros;
  target: DailyTarget;
  allEntries: MealEntry[];
}

export function MacroCoachCard({ totals, target }: MacroCoachCardProps) {
  const remainingCalories = target.calories - totals.calories;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 p-5 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/15 text-emerald-400">
          <Sparkles size={16} />
        </div>
        <h3 className="text-sm font-bold tracking-tight text-white">Coach Intelligente</h3>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.03] px-3.5 py-2.5">
          <span className="text-slate-400">Calorie rimanenti</span>
          <span className={`font-extrabold ${remainingCalories >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {remainingCalories} kcal
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3.5 py-2.5 text-emerald-300/90">
          <TrendingUp size={15} className="shrink-0 text-emerald-400" />
          <p className="leading-relaxed">
            {remainingCalories > 0
              ? `Continua così! Ti mancano ${remainingCalories} kcal per raggiungere il tuo obiettivo giornaliero.`
              : "Hai raggiunto o superato l'obiettivo calorico giornaliero stabilito."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MacroCoachCard;