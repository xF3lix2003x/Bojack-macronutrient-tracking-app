"use client";

import { useEffect, useState } from "react";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { MacroBadge } from "@/components/ui/MacroBadge";
import type { FoodItem } from "@/lib/food/schemas";
import { formatServingLabel, scaleMacrosToGrams } from "@/lib/food/nutrition";

interface FoodSearchModalProps {
  onClose: () => void;
  onSelect: (food: FoodItem) => void;
  onCreateCustom: () => void;
}

export function FoodSearchModal({ onClose, onSelect, onCreateCustom }: FoodSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.foods || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400); // debounce 400ms

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <Modal title="Cerca Alimento" subtitle="Cerca su Open Food Facts o creane uno" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca prodotto (es. Nutella, Petto di pollo...)"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-9 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          />
          {loading && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />
          )}
        </div>

        <button
          type="button"
          onClick={onCreateCustom}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-sky-500/40 px-4 py-2.5 text-sm font-medium text-sky-300 transition hover:border-sky-400 hover:bg-sky-500/10"
        >
          <PlusCircle size={16} /> Crea Alimento Personalizzato
        </button>

        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Nessun alimento trovato su Open Food Facts.</p>
          )}

          {query.trim().length < 2 && (
            <p className="py-8 text-center text-sm text-zinc-600">Digita almeno 2 lettere per cercare online...</p>
          )}

          {results.map((food) => {
            const previewGrams = food.defaultServing.unit === "portion" ? 100 : food.defaultServing.amount;
            const preview = scaleMacrosToGrams(food.macrosPer100g, previewGrams);
            return (
              <button
                key={food.id}
                type="button"
                onClick={() => onSelect(food)}
                className="flex flex-col gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition hover:border-sky-500/40 hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-zinc-100">{food.name}</span>
                </div>
                <span className="text-xs text-zinc-500">
                  {food.brand ? `${food.brand} · ` : ""}
                  per {formatServingLabel(food.defaultServing)}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                    {preview.calories} kcal
                  </span>
                  <MacroBadge macro="protein" value={preview.protein} compact />
                  <MacroBadge macro="carbs" value={preview.carbs} compact />
                  <MacroBadge macro="fat" value={preview.fat} compact />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}