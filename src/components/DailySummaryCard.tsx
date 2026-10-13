"use client";

import type { DailyTarget, MacroNutrients } from "@/lib/food/schemas";
import { CalorieRing } from "@/components/ui/CalorieRing";

interface DailySummaryCardProps {
  totals: MacroNutrients;
  target: DailyTarget;
}

export function DailySummaryCard({ totals, target }: DailySummaryCardProps) {
  const macros = [
    {
      label: "Proteine",
      current: totals.protein,
      target: target.protein || 140,
      textColor: "text-emerald-400",
      pillBg: "bg-emerald-950/40 border-emerald-800/40",
      barColor: "bg-emerald-400",
    },
    {
      label: "Carboidrati",
      current: totals.carbs,
      target: target.carbs || 220,
      textColor: "text-amber-400",
      pillBg: "bg-amber-950/40 border-amber-800/40",
      barColor: "bg-amber-400",
    },
    {
      label: "Grassi",
      current: totals.fat,
      target: target.fat || 75,
      textColor: "text-rose-400",
      pillBg: "bg-rose-950/40 border-rose-800/40",
      barColor: "bg-rose-400",
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <CalorieRing current={totals.calories} target={target.calories} />

      <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
        {macros.map((m) => {
          const percent = Math.min(100, Math.round((m.current / m.target) * 100));
          return (
            <div
              key={m.label}
              className={`flex flex-col rounded-2xl border px-3 py-2.5 backdrop-blur-md ${m.pillBg}`}
            >
              <span className={`text-[13px] font-semibold tracking-tight ${m.textColor}`}>
                {m.label}
              </span>

              <div className="my-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${m.barColor}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <span className="text-xs font-medium text-zinc-300 tabular-nums">
                {Math.round(m.current)}g / {Math.round(m.target)}g
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}