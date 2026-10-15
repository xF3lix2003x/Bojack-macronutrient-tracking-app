"use client";

import { useMemo, useState } from "react";
import { Calculator, Check, Loader2, RefreshCw, Sliders } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DailyTargetSchema, type DailyTarget } from "@/lib/food/schemas";
import { estimateCaloriesFromMacros } from "@/lib/food/nutrition";
import { useFoodStore } from "@/store/useFoodStore";

interface DailyTargetModalProps {
  current: DailyTarget;
  onClose: () => void;
}

type TabMode = "manual" | "calculator";
type GoalType = "cut" | "maintain" | "bulk";

const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentario", desc: "Ufficio, spostamenti in auto" },
  { value: 1.375, label: "Leggero", desc: "1-2 allenamenti o 7.000 passi/giorno" },
  { value: 1.55, label: "Moderato", desc: "3-4 allenamenti o 10.000 passi/giorno" },
  { value: 1.725, label: "Intenso", desc: "5-6 allenamenti intensi a settimana" },
];

export function DailyTargetModal({ current, onClose }: DailyTargetModalProps) {
  const setDailyTarget = useFoodStore((state) => state.setDailyTarget);
  const [tab, setTab] = useState<TabMode>("manual");
  const [values, setValues] = useState<DailyTarget>(current);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stato Calcolatore TDEE
  const [sex, setSex] = useState<"M" | "F">("M");
  const [age, setAge] = useState(23);
  const [weight, setWeight] = useState(74);
  const [height, setHeight] = useState(178);
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<GoalType>("maintain");

  // Calcolo calorie reali derivanti dai grammi dei 3 macro (Formula di Atwater: 4P + 4C + 9F)
  const macrosKcal = useMemo(
    () =>
      Math.round(
        estimateCaloriesFromMacros({
          protein: Number(values.protein) || 0,
          carbs: Number(values.carbs) || 0,
          fat: Number(values.fat) || 0,
        })
      ),
    [values.protein, values.carbs, values.fat]
  );

  const macroSplitPercent = useMemo(() => {
    const total = macrosKcal || 1;
    return {
      p: Math.round(((values.protein * 4) / total) * 100),
      c: Math.round(((values.carbs * 4) / total) * 100),
      f: Math.round(((values.fat * 9) / total) * 100),
    };
  }, [values.protein, values.carbs, values.fat, macrosKcal]);

  const kcalDiff = Math.abs((Number(values.calories) || 0) - macrosKcal);

  const applyCalculation = () => {
    const bmr =
      sex === "M"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const tdee = bmr * activity;
    const goalOffset = goal === "cut" ? -400 : goal === "bulk" ? 300 : 0;
    const targetCalories = Math.max(1200, Math.round(tdee + goalOffset));

    const protein = Math.round(weight * 2.0);
    const fat = Math.round(weight * 0.9);
    const remainingKcal = Math.max(0, targetCalories - protein * 4 - fat * 9);
    const carbs = Math.round(remainingKcal / 4);

    setValues({ calories: targetCalories, protein, carbs, fat });
    setTab("manual");
  };

  const handleSave = async () => {
    const parsed = DailyTargetSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valori non validi");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await setDailyTarget(parsed.data);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-white/[0.08] bg-[#161A26] px-3.5 text-sm font-bold text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 tabular-nums";
  const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400";

  return (
    <Modal
      title="Obiettivi Nutrizionali"
      subtitle="Personalizza i tuoi macro o calcola il tuo TDEE"
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        {/* Switcher Manuale / Calcolatore */}
        <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-[#161A26] p-1">
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
              tab === "manual" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders size={14} /> Impostazione Manuale
          </button>
          <button
            type="button"
            onClick={() => setTab("calculator")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
              tab === "calculator" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Calculator size={14} /> Calcolatore TDEE
          </button>
        </div>

        {tab === "calculator" ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sesso Biologico</label>
                <div className="grid h-11 grid-cols-2 gap-1.5 rounded-xl border border-white/[0.08] bg-[#161A26] p-1">
                  {(["M", "F"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`rounded-lg text-xs font-bold transition ${
                        sex === s ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {s === "M" ? "Uomo" : "Donna"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Età (anni)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                />
              </div>

              <div>
                <label className={labelClass}>Peso Attuale (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  className={inputClass}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
              </div>

              <div>
                <label className={labelClass}>Altezza (cm)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Card Selettore Attività al posto del <select> nativo */}
            <div>
              <label className={labelClass}>Livello di Attività Quotidiana</label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setActivity(lvl.value)}
                    className={`flex flex-col rounded-xl border p-2.5 text-left transition ${
                      activity === lvl.value
                        ? "border-emerald-500/50 bg-emerald-500/15"
                        : "border-white/[0.06] bg-[#161A26] hover:border-white/15"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        activity === lvl.value ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {lvl.label}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium text-slate-400">
                      {lvl.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scelta Obiettivo */}
            <div>
              <label className={labelClass}>Fase Nutrizionale</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cut", label: "Definizione", sub: "-400 kcal" },
                  { id: "maintain", label: "Mantenimento", sub: "TDEE" },
                  { id: "bulk", label: "Massa Pulita", sub: "+300 kcal" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id as GoalType)}
                    className={`flex flex-col items-center rounded-xl border py-2.5 px-2 transition ${
                      goal === g.id
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/[0.06] bg-[#161A26] text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold">{g.label}</span>
                    <span className="text-[10px] opacity-75">{g.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={applyCalculation}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-sm font-extrabold text-slate-950 shadow-lg transition hover:brightness-110"
            >
              <Calculator size={17} /> Calcola e Applica Target
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400" htmlFor="target-calories">
                    Target Calorie Giornaliere (kcal)
                  </label>
                  {kcalDiff > 15 && (
                    <button
                      type="button"
                      onClick={() => setValues((prev) => ({ ...prev, calories: macrosKcal }))}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/25"
                    >
                      <RefreshCw size={11} /> Allinea ai macro ({macrosKcal} kcal)
                    </button>
                  )}
                </div>
                <input
                  id="target-calories"
                  type="number"
                  className={`${inputClass} border-l-4 border-l-emerald-400 text-lg`}
                  value={values.calories}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, calories: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-cyan-400" htmlFor="target-protein">
                  Proteine (g)
                </label>
                <input
                  id="target-protein"
                  type="number"
                  className={`${inputClass} border-l-4 border-l-cyan-400`}
                  value={values.protein}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, protein: Number(e.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-amber-400" htmlFor="target-carbs">
                  Carboidrati (g)
                </label>
                <input
                  id="target-carbs"
                  type="number"
                  className={`${inputClass} border-l-4 border-l-amber-400`}
                  value={values.carbs}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, carbs: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-rose-400" htmlFor="target-fat">
                  Grassi (g)
                </label>
                <input
                  id="target-fat"
                  type="number"
                  className={`${inputClass} border-l-4 border-l-rose-400`}
                  value={values.fat}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, fat: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            {/* Barra Live Ripartizione Calorica Atwater */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#161A26]/80 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400">Ripartizione Macro</span>
                <span className="font-display font-bold text-slate-200 tabular-nums">
                  {macroSplitPercent.p}% P · {macroSplitPercent.c}% C · {macroSplitPercent.f}% G
                </span>
              </div>
              <div className="mt-2 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-800">
                <div className="bg-cyan-400 transition-all" style={{ width: `${macroSplitPercent.p}%` }} />
                <div className="bg-amber-400 transition-all" style={{ width: `${macroSplitPercent.c}%` }} />
                <div className="bg-rose-400 transition-all" style={{ width: `${macroSplitPercent.f}%` }} />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-sm font-extrabold text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition hover:brightness-110 disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
              Salva Obiettivi
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}