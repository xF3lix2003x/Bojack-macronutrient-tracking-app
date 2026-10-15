"use client";

import React from "react";
import type { Macros, DailyTarget, MealEntry } from "@/lib/food/schemas";
import { Sparkles, Flame, CheckCircle2, AlertTriangle } from "lucide-react";

interface MacroCoachCardProps {
  totals: Macros;
  target: DailyTarget;
  allEntries: MealEntry[];
}

export function MacroCoachCard({ totals, target }: MacroCoachCardProps) {
  const consumed = Math.round(totals.calories);
  const goal = Math.max(1, target.calories);
  const remaining = goal - consumed;
  const isOver = remaining < 0;
  const isOptimal = Math.abs(remaining) <= goal * 0.05;

  const progress = Math.min(1, Math.max(0, consumed / goal));
  const size = 136;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const macroItems = [
    {
      key: "protein",
      label: "Proteine",
      current: Math.round(totals.protein),
      target: target.protein,
      color: "bg-cyan-400",
      textColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
      tintBg: "bg-cyan-500/[0.07]",
      glow: "shadow-[0_0_12px_rgba(34,211,238,0.45)]",
    },
    {
      key: "carbs",
      label: "Carboidrati",
      current: Math.round(totals.carbs),
      target: target.carbs,
      color: "bg-amber-400",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/20",
      tintBg: "bg-amber-500/[0.07]",
      glow: "shadow-[0_0_12px_rgba(251,191,36,0.45)]",
    },
    {
      key: "fat",
      label: "Grassi",
      current: Math.round(totals.fat),
      target: target.fat,
      color: "bg-rose-400",
      textColor: "text-rose-400",
      borderColor: "border-rose-500/20",
      tintBg: "bg-rose-500/[0.07]",
      glow: "shadow-[0_0_12px_rgba(251,113,133,0.45)]",
    },
  ];

  const getCoachMessage = () => {
    if (consumed === 0) {
      return "Inizia la giornata registrando il primo pasto: BoTrack adatterà i consigli in tempo reale.";
    }
    const proteinLeft = Math.round(target.protein - totals.protein);
    if (isOptimal) {
      return "Precisione perfetta! Sei esattamente nel range calorico ottimale di oggi.";
    }
    if (isOver) {
      return `Hai superato il target di ${Math.abs(remaining)} kcal. Mantieni alta l'idratazione e bilancia domani senza stress.`;
    }
    if (proteinLeft > 35 && remaining < 650) {
      return `Ti restano ${remaining} kcal e ${proteinLeft}g di proteine: privilegia una fonte proteica magra nel prossimo pasto.`;
    }
    return `Ottimo ritmo! Hai ancora ${remaining} kcal disponibili per completare la giornata.`;
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#11151F] p-5 shadow-[0_14px_34px_-12px_rgba(0,0,0,0.65)]">
      {/* Glow ambientale dinamico */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl transition-colors duration-700 ${
          isOver
            ? "bg-amber-500/15"
            : isOptimal
            ? "bg-teal-400/20"
            : "bg-emerald-500/15"
        }`}
      />

      {/* Intestazione Card */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-emerald-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Bilancio Energetico
          </h2>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-[#181D2B] px-2.5 py-1 text-[11px] font-bold text-slate-300 tabular-nums">
          {consumed} / {goal} kcal
        </span>
      </div>

      {/* Fulcro Visivo: Anello Bioluminescente + Statistiche Laterali */}
      <div className="flex items-center justify-between gap-5">
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width={size} height={size} className="-rotate-90 transform">
            <defs>
              <linearGradient id="botrackRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isOver ? "#F59E0B" : "#10B981"} />
                <stop offset="100%" stopColor={isOver ? "#FB7185" : "#06B6D4"} />
              </linearGradient>
            </defs>
            {/* Traccia di fondo */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={strokeWidth}
            />
            {/* Arco attivo */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="url(#botrackRingGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                filter: isOver
                  ? "drop-shadow(0 0 8px rgba(245, 158, 11, 0.45))"
                  : "drop-shadow(0 0 8px rgba(16, 185, 129, 0.45))",
              }}
            />
          </svg>

          {/* Testo Centrale dell'Anello */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`font-display text-3xl font-black tracking-tight tabular-nums ${
                isOver ? "text-amber-400" : "text-white"
              }`}
            >
              {Math.abs(remaining)}
            </span>
            <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isOver ? "kcal oltre" : "kcal restanti"}
            </span>
          </div>
        </div>

        {/* Colonna Destra: Riepilogo Assunte / Obiettivo / % */}
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="rounded-2xl border border-white/[0.06] bg-[#181D2B]/90 px-3.5 py-2.5">
            <span className="block text-[11px] font-semibold text-slate-400">
              Assunte oggi
            </span>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="font-display text-lg font-extrabold text-white tabular-nums">
                {consumed}{" "}
                <span className="text-xs font-semibold text-slate-400">kcal</span>
              </span>
              <span className="text-xs font-extrabold text-emerald-400 tabular-nums">
                {Math.round((consumed / goal) * 100)}%
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#181D2B]/90 px-3.5 py-2.5">
            <span className="block text-[11px] font-semibold text-slate-400">
              Densità Proteica
            </span>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="font-display text-lg font-extrabold text-cyan-400 tabular-nums">
                {Math.round(totals.protein)}g
              </span>
              <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                su {target.protein}g
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Griglia 3 Colonne Macronutrienti */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {macroItems.map((m) => {
          const pct = Math.min(
            100,
            Math.round((m.current / Math.max(1, m.target)) * 100)
          );
          return (
            <div
              key={m.key}
              className={`rounded-2xl border ${m.borderColor} ${m.tintBg} p-3 transition`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wider ${m.textColor}`}
                >
                  {m.label}
                </span>
                <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                  {pct}%
                </span>
              </div>

              <div className="mt-1.5 flex items-baseline gap-1 tabular-nums">
                <span className="font-display text-base font-extrabold text-white">
                  {m.current}g
                </span>
                <span className="text-xs font-medium text-slate-400">
                  / {m.target}g
                </span>
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/90">
                <div
                  className={`h-full rounded-full ${m.color} ${m.glow} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer AI Coach Integrato */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent px-3.5 py-3">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
          {isOptimal ? (
            <CheckCircle2 size={14} />
          ) : isOver ? (
            <AlertTriangle size={14} className="text-amber-300" />
          ) : (
            <Sparkles size={14} />
          )}
        </div>
        <p className="text-xs font-medium leading-relaxed text-slate-200">
          {getCoachMessage()}
        </p>
      </div>
    </section>
  );
}

export default MacroCoachCard;