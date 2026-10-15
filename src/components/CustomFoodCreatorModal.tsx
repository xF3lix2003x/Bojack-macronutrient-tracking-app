"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { CreateCustomFoodInput, FoodItem, ServingUnit } from "@/lib/food/schemas";
import { X, PlusCircle } from "lucide-react";

export interface CustomFoodCreatorModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
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
  const isModalOpen = isOpen ?? open ?? true;
  const resolvedBarcode = initialBarcode ?? defaultBarcode ?? barcode ?? undefined;
  const resolvedName = initialName ?? defaultName ?? "";

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

  if (!isModalOpen) return null;

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

    onCreated?.(newFood);
    onCreate?.(newFood);
    onSave?.(newFood);
    onSubmitFood?.(newFood);
    onClose();
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0D13] p-6 text-slate-100 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold text-white">Crea Alimento Personalizzato</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block text-slate-400">Nome alimento *</label>
            <input
              type="text"
              required
              value={watched.name}
              onChange={(e) => setWatched({ ...watched, name: e.target.value })}
              className={inputClass}
              placeholder="Es. Petto di pollo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-slate-400">Marca</label>
              <input
                type="text"
                value={watched.brand ?? ""}
                onChange={(e) => setWatched({ ...watched, brand: e.target.value || undefined })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-400">Barcode</label>
              <input
                type="text"
                value={watched.barcode ?? ""}
                onChange={(e) => setWatched({ ...watched, barcode: e.target.value || undefined })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-slate-400">Porzione</label>
              <input
                type="number"
                value={watched.servingAmount}
                onChange={(e) => setWatched({ ...watched, servingAmount: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-400">Unità</label>
              <select
                value={watched.servingUnit}
                onChange={(e) => setWatched({ ...watched, servingUnit: e.target.value as ServingUnit })}
                className="w-full rounded-xl border border-white/10 bg-[#12151E] px-3 py-2 text-white outline-none focus:border-emerald-500"
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="pz">pz</option>
                <option value="portion">Porzione</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="mb-1 block text-slate-400">Calorie (per 100g)</label>
              <input
                type="number"
                step="any"
                value={watched.caloriesPer100g}
                onChange={(e) => setWatched({ ...watched, caloriesPer100g: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-400">Proteine (per 100g)</label>
              <input
                type="number"
                step="any"
                value={watched.proteinPer100g}
                onChange={(e) => setWatched({ ...watched, proteinPer100g: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-400">Carboidrati (per 100g)</label>
              <input
                type="number"
                step="any"
                value={watched.carbsPer100g}
                onChange={(e) => setWatched({ ...watched, carbsPer100g: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-400">Grassi (per 100g)</label>
              <input
                type="number"
                step="any"
                value={watched.fatPer100g}
                onChange={(e) => setWatched({ ...watched, fatPer100g: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          <p className="pt-1 text-[11px] text-slate-400">
            Anteprima porzione ({previewGrams}g):{" "}
            <span className="font-bold text-emerald-400">
              {Math.round(((watched.caloriesPer100g || 0) * previewGrams) / 100)} kcal
            </span>
          </p>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-slate-300 hover:bg-white/5"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400"
            >
              Salva Alimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomFoodCreatorModal;