"use client";

import { useEffect, useState } from "react";
import { Check, Droplets, Pill, Plus, Scale } from "lucide-react";
import { triggerHaptic } from "@/lib/mobileUtils";

interface DailyWellnessData {
  waterMl: number;
  supplements: string[];
  weightKg: number;
}

const DEFAULT_SUPPLEMENTS = ["Creatina 5g", "Caffeina", "Omega 3"];

export function WellnessStrip({ dateKey }: { dateKey: string }) {
  const storageKey = `wellness-${dateKey}`;
  const [waterMl, setWaterMl] = useState(0);
  const [takenSupps, setTakenSupps] = useState<string[]>([]);
  const [weightKg, setWeightKg] = useState<number>(74.0);
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  useEffect(() => {
    try {
      const savedWeight = localStorage.getItem("macrotrack-last-weight");
      if (savedWeight) setWeightKg(Number(savedWeight));

      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DailyWellnessData>;
        setWaterMl(parsed.waterMl ?? 0);
        setTakenSupps(parsed.supplements ?? []);
        if (parsed.weightKg) setWeightKg(parsed.weightKg);
      } else {
        setWaterMl(0);
        setTakenSupps([]);
      }
    } catch {
      // Ignora errori storage
    }
  }, [storageKey]);

  const saveState = (nextWater: number, nextSupps: string[], nextWeight: number) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          waterMl: nextWater,
          supplements: nextSupps,
          weightKg: nextWeight,
        })
      );
      localStorage.setItem("macrotrack-last-weight", String(nextWeight));
    } catch {
      // Ignora
    }
  };

  const addWater = (delta: number) => {
    triggerHaptic("light");
    const next = Math.max(0, Math.min(5000, waterMl + delta));
    setWaterMl(next);
    saveState(next, takenSupps, weightKg);
  };

  const toggleSupplement = (name: string) => {
    triggerHaptic("light");
    const next = takenSupps.includes(name)
      ? takenSupps.filter((s) => s !== name)
      : [...takenSupps, name];
    setTakenSupps(next);
    saveState(waterMl, next, weightKg);
  };

  const handleWeightSave = (val: number) => {
    if (Number.isFinite(val) && val > 30 && val < 250) {
      setWeightKg(val);
      saveState(waterMl, takenSupps, val);
    }
    setIsEditingWeight(false);
  };

  const waterTarget = 2500;
  const waterPercent = Math.min(100, Math.round((waterMl / waterTarget) * 100));

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Card Idratazione */}
        <div className="flex flex-col justify-between rounded-[20px] border border-white/[0.06] bg-[#12151E] p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <Droplets size={16} />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Acqua</span>
                <span className="font-display text-[11px] font-bold text-sky-400 tabular-nums">
                  {waterMl} / {waterTarget}ml
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addWater(250)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/15 text-sky-300 transition hover:bg-sky-500 hover:text-slate-950 active:scale-95"
              title="+250ml Acqua"
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-300"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
        </div>

        {/* Card Peso Corporeo */}
        <div className="flex flex-col justify-between rounded-[20px] border border-white/[0.06] bg-[#12151E] p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Scale size={16} />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Peso</span>
                {isEditingWeight ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.1"
                    defaultValue={weightKg}
                    onBlur={(e) => handleWeightSave(e.target.valueAsNumber)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleWeightSave((e.target as HTMLInputElement).valueAsNumber);
                      }
                    }}
                    className="font-display w-16 border-b border-emerald-400 bg-transparent text-sm font-bold text-white outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingWeight(true)}
                    className="font-display text-sm font-bold text-emerald-400 tabular-nums hover:underline"
                  >
                    {weightKg.toFixed(1)} kg
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingWeight(true)}
              className="rounded-lg bg-[#1A1E2B] px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white"
            >
              Registra
            </button>
          </div>
          <span className="mt-2 text-[10px] font-medium text-slate-400">
            Tocca il peso per aggiornare il diario
          </span>
        </div>
      </div>

      {/* Checklist Rapida Integratori */}
      <div className="flex items-center justify-between gap-2 rounded-[20px] border border-white/[0.06] bg-[#12151E] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Pill size={15} className="text-purple-400" />
          <span>Stack:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_SUPPLEMENTS.map((supp) => {
            const isTaken = takenSupps.includes(supp);
            return (
              <button
                key={supp}
                type="button"
                onClick={() => toggleSupplement(supp)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                  isTaken
                    ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "bg-[#1A1E2B] text-slate-400 hover:text-white"
                }`}
              >
                {isTaken && <Check size={11} strokeWidth={3} />}
                {supp}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}