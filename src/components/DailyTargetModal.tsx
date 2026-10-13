"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DailyTargetSchema, type DailyTarget } from "@/lib/food/schemas";
import { useFoodStore } from "@/store/useFoodStore";

interface DailyTargetModalProps {
  current: DailyTarget;
  onClose: () => void;
}

export function DailyTargetModal({ current, onClose }: DailyTargetModalProps) {
  const setDailyTarget = useFoodStore((state) => state.setDailyTarget);
  const [values, setValues] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";
  const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500";

  const handleSave = async () => {
    const parsed = DailyTargetSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid target values");
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

  return (
    <Modal title="Daily Targets" subtitle="Set your calorie and macro goals" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="target-calories">
              Calories (kcal)
            </label>
            <input
              id="target-calories"
              type="number"
              className={inputClass}
              value={values.calories}
              onChange={(event) => setValues((prev) => ({ ...prev, calories: Number(event.target.value) }))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="target-protein">
              Protein (g)
            </label>
            <input
              id="target-protein"
              type="number"
              className={inputClass}
              value={values.protein}
              onChange={(event) => setValues((prev) => ({ ...prev, protein: Number(event.target.value) }))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="target-carbs">
              Carbs (g)
            </label>
            <input
              id="target-carbs"
              type="number"
              className={inputClass}
              value={values.carbs}
              onChange={(event) => setValues((prev) => ({ ...prev, carbs: Number(event.target.value) }))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="target-fat">
              Fat (g)
            </label>
            <input
              id="target-fat"
              type="number"
              className={inputClass}
              value={values.fat}
              onChange={(event) => setValues((prev) => ({ ...prev, fat: Number(event.target.value) }))}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Target size={18} />}
          Save Targets
        </button>
      </div>
    </Modal>
  );
}
