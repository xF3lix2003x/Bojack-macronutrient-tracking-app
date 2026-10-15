"use client";

import { useEffect, useState } from "react";
import { Check, Droplets, Minus, Pill, Plus, Scale, X } from "lucide-react";
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
  const [customSuppList, setCustomSuppList] =
    useState<string[]>(DEFAULT_SUPPLEMENTS);
  const [isAddingSupp, setIsAddingSupp] = useState(false);
  const [newSuppName, setNewSuppName] = useState("");
  const [weightKg, setWeightKg] = useState<number>(74.0);
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  useEffect(() => {
    try {
      const savedSuppList = localStorage.getItem("botrack-custom-supps");
      if (savedSuppList) {
        const parsedList = JSON.parse(savedSuppList) as string[];
        if (Array.isArray(parsedList) && parsedList.length > 0) {
          setCustomSuppList(parsedList);
        }
      }

      const savedWeight =
        localStorage.getItem("botrack-last-weight") ??
        localStorage.getItem("macrotrack-last-weight");
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

  const saveState = (
    nextWater: number,
    nextSupps: string[],
    nextWeight: number
  ) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          waterMl: nextWater,
          supplements: nextSupps,
          weightKg: nextWeight,
        })
      );
      localStorage.setItem("botrack-last-weight", String(nextWeight));
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

  const handleAddCustomSupplement = () => {
    const clean = newSuppName.trim();
    if (!clean) {
      setIsAddingSupp(false);
      return;
    }
    if (!customSuppList.includes(clean)) {
      const updated = [...customSuppList, clean];
      setCustomSuppList(updated);
      try {
        localStorage.setItem("botrack-custom-supps", JSON.stringify(updated));
      } catch {
        // Ignora
      }
    }
    setNewSuppName("");
    setIsAddingSupp(false);
  };

  const handleRemoveSuppFromList = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const updated = customSuppList.filter((s) => s !== name);
    setCustomSuppList(updated);
    try {
      localStorage.setItem("botrack-custom-supps", JSON.stringify(updated));
    } catch {
      // Ignora
    }
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
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Card Idratazione con effetto Liquid Fill */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.07] bg-[#11151F] p-4">
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500/15 to-cyan-400/5 transition-all duration-500"
            style={{ height: `${waterPercent}%` }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <Droplets size={18} />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-white">
                  Acqua
                </span>
                <span className="font-display text-xs font-bold text-sky-400 tabular-nums">
                  {waterMl}{" "}
                  <span className="text-[11px] font-medium text-slate-400">
                    / {waterTarget}ml
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/90">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-1">
              {waterMl > 0 && (
                <button
                  type="button"
                  onClick={() => addWater(-250)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#181D2B] text-slate-300 transition hover:text-white active:scale-95"
                  title="-250ml"
                >
                  <Minus size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => addWater(250)}
                className="flex h-7 items-center gap-0.5 rounded-lg border border-sky-500/30 bg-sky-500/15 px-2 text-[11px] font-extrabold text-sky-300 transition hover:bg-sky-500 hover:text-slate-950 active:scale-95"
                title="+250ml Acqua"
              >
                <Plus size={12} strokeWidth={3} />
                <span>250</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Peso Corporeo */}
        <div className="flex flex-col justify-between rounded-3xl border border-white/[0.07] bg-[#11151F] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Scale size={18} />
              </div>
              <div>
                <span className="block text-xs font-extrabold text-white">
                  Peso
                </span>
                {isEditingWeight ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.1"
                    defaultValue={weightKg}
                    onBlur={(e) => handleWeightSave(e.target.valueAsNumber)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleWeightSave(
                          (e.target as HTMLInputElement).valueAsNumber
                        );
                      }
                    }}
                    className="font-display w-16 border-b-2 border-emerald-400 bg-transparent text-sm font-extrabold text-white outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingWeight(true)}
                    className="font-display text-sm font-extrabold text-emerald-400 tabular-nums hover:underline"
                  >
                    {weightKg.toFixed(1)} kg
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingWeight(true)}
              className="rounded-xl border border-white/[0.06] bg-[#181D2B] px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:text-white"
            >
              Modifica
            </button>
          </div>
          <span className="mt-3 text-[11px] font-medium text-slate-400">
            Tocca il valore per aggiornare
          </span>
        </div>
      </div>

      {/* Checklist Rapida Integratori Personalizzabile */}
      <div className="rounded-3xl border border-white/[0.07] bg-[#11151F] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex shrink-0 items-center gap-2 text-xs font-extrabold text-slate-300">
            <Pill size={15} className="text-purple-400" />
            <span>Stack:</span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {customSuppList.map((supp) => {
              const isTaken = takenSupps.includes(supp);
              return (
                <button
                  key={supp}
                  type="button"
                  onClick={() => toggleSupplement(supp)}
                  className={`group inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                    isTaken
                      ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : "border border-white/[0.05] bg-[#181D2B] text-slate-400 hover:text-white"
                  }`}
                >
                  {isTaken && <Check size={12} strokeWidth={3} />}
                  <span>{supp}</span>
                  {customSuppList.length > 1 && (
                    <span
                      onClick={(e) => handleRemoveSuppFromList(e, supp)}
                      className="ml-0.5 hidden rounded-full p-0.5 text-slate-500 hover:text-rose-400 group-hover:inline-flex"
                      title="Rimuovi dallo stack"
                    >
                      <X size={10} />
                    </span>
                  )}
                </button>
              );
            })}

            {isAddingSupp ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomSupplement();
                    if (e.key === "Escape") setIsAddingSupp(false);
                  }}
                  placeholder="Es. Vitamina D"
                  className="h-7 w-28 rounded-full border border-emerald-500/40 bg-[#181D2B] px-2.5 text-[11px] font-semibold text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSupplement}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingSupp(true)}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-white/15 bg-[#181D2B]/60 px-2.5 text-[11px] font-bold text-slate-400 transition hover:border-emerald-400 hover:text-emerald-300"
                title="Aggiungi integratore"
              >
                <Plus size={11} /> Nuovo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WellnessStrip;