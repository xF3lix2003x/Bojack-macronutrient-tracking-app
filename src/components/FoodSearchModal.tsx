"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Globe, History, Loader2, Plus, PlusCircle, Search, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useFoodStore } from "@/store/useFoodStore";
import { ITALIAN_STAPLE_FOODS } from "@/lib/food/italianBaseFoods";
import type { FoodItem, MealType } from "@/lib/food/schemas";
import { formatServingLabel, scaleMacrosToGrams } from "@/lib/food/nutrition";
import { MEAL_TYPE_LABELS } from "@/lib/food/theme";
import { triggerHaptic } from "@/lib/mobileUtils";

interface FoodSearchModalProps {
  mealType?: MealType;
  onClose: () => void;
  onSelect: (food: FoodItem) => void;
  onQuickLog?: (food: FoodItem) => void;
  onCreateCustom: () => void;
}

type FilterTab = "frequent" | "all" | "custom" | "online";

export function FoodSearchModal({
  mealType = "snack",
  onClose,
  onSelect,
  onQuickLog,
  onCreateCustom,
}: FoodSearchModalProps) {
  const storeFoods = useFoodStore((state) => state.foods);
  const mealEntries = useFoodStore((state) => state.mealEntries);

  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("frequent");
  const [remoteFoods, setRemoteFoods] = useState<FoodItem[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Unisce i cibi dello store locale con il dizionario completo CREA italiano
  const allLocalFoods = useMemo(() => {
    const map = new Map<string, FoodItem>();
    for (const item of ITALIAN_STAPLE_FOODS) {
      map.set(item.id, item);
    }
    for (const item of storeFoods) {
      map.set(item.id, item);
    }
    return Array.from(map.values());
  }, [storeFoods]);

  // Statistiche di utilizzo per pasto
  const frequencyStats = useMemo(() => {
    const mealCountMap = new Map<string, number>();
    const totalCountMap = new Map<string, number>();
    const lastServingMap = new Map<string, FoodItem["defaultServing"]>();

    for (const entry of mealEntries) {
      const id = entry.foodItem.id;
      totalCountMap.set(id, (totalCountMap.get(id) ?? 0) + 1);
      if (entry.mealType === mealType) {
        mealCountMap.set(id, (mealCountMap.get(id) ?? 0) + 1);
      }
      if (!lastServingMap.has(id)) {
        lastServingMap.set(id, entry.loggedServing);
      }
    }

    return { mealCountMap, totalCountMap, lastServingMap };
  }, [mealEntries, mealType]);

  // Passa automaticamente al tab "Tutti" quando l'utente digita qualcosa
  useEffect(() => {
    if (query.trim().length >= 1 && filterTab === "frequent") {
      setFilterTab("all");
    }
  }, [query, filterTab]);

  const localFiltered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allLocalFoods;
    return allLocalFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(normalized) ||
        food.brand?.toLowerCase().includes(normalized)
    );
  }, [allLocalFoods, query]);

  // Ricerca remota (API interna + fallback diretto Open Food Facts)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemoteFoods([]);
      setIsSearchingRemote(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { foods: FoodItem[] };
          if (!isCancelled && Array.isArray(data.foods) && data.foods.length > 0) {
            setRemoteFoods(data.foods);
            setIsSearchingRemote(false);
            return;
          }
        }

        // Fallback client-side diretto a Open Food Facts se l'API locale non risponde
        const offUrl = `https://it.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          q
        )}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,product_name_it,brands,nutriments,serving_quantity`;
        const offRes = await fetch(offUrl);
        if (offRes.ok && !isCancelled) {
          const offData = await offRes.json();
          const products = Array.isArray(offData.products) ? offData.products : [];
          const mapped: FoodItem[] = products
            .filter((p: any) => (p.product_name_it || p.product_name) && p.nutriments)
            .map((p: any) => ({
              id: p.code ? `off-${p.code}` : `off-${Math.random().toString(36).slice(2, 8)}`,
              name: (p.product_name_it || p.product_name || "Alimento").trim(),
              brand: p.brands ? p.brands.split(",")[0].trim() : "OpenFoodFacts",
              barcode: p.code ? String(p.code) : undefined,
              macrosPer100g: {
                calories: Math.round(p.nutriments["energy-kcal_100g"] ?? 0),
                protein: Number((p.nutriments.proteins_100g ?? 0).toFixed(1)),
                carbs: Number((p.nutriments.carbohydrates_100g ?? 0).toFixed(1)),
                fat: Number((p.nutriments.fat_100g ?? 0).toFixed(1)),
              },
              defaultServing: { unit: "g", amount: Number(p.serving_quantity) || 100 },
              isCustom: false,
            }));
          setRemoteFoods(mapped);
        }
      } catch {
        // Mantiene i risultati locali
      } finally {
        if (!isCancelled) setIsSearchingRemote(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const displayedList = useMemo(() => {
    const seenIds = new Set<string>();
    const combined: FoodItem[] = [];

    for (const item of [...localFiltered, ...remoteFoods]) {
      const key = item.barcode || item.id;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        const lastServing = frequencyStats.lastServingMap.get(item.id);
        combined.push(lastServing ? { ...item, defaultServing: lastServing } : item);
      }
    }

    if (filterTab === "frequent") {
      return [...combined].sort((a, b) => {
        const mealDiff =
          (frequencyStats.mealCountMap.get(b.id) ?? 0) -
          (frequencyStats.mealCountMap.get(a.id) ?? 0);
        if (mealDiff !== 0) return mealDiff;
        return (
          (frequencyStats.totalCountMap.get(b.id) ?? 0) -
          (frequencyStats.totalCountMap.get(a.id) ?? 0)
        );
      });
    }

    if (filterTab === "custom") return combined.filter((f) => f.isCustom);
    if (filterTab === "online") {
      return combined.filter(
        (f) => String(f.id).startsWith("off-") || String(f.id).startsWith("usda-")
      );
    }
    return combined;
  }, [localFiltered, remoteFoods, filterTab, frequencyStats]);

  const handleQuickAddClick = (e: React.MouseEvent, food: FoodItem) => {
    e.stopPropagation();
    triggerHaptic("success");
    setJustAddedId(food.id);
    onQuickLog?.(food);
    setTimeout(() => setJustAddedId(null), 900);
  };

  const mealLabel = MEAL_TYPE_LABELS[mealType] ?? "Pasto";

  return (
    <Modal
      title={`Aggiungi a ${mealLabel}`}
      subtitle="Tocca un cibo per i grammi o premi + per l'aggiunta rapida"
      onClose={onClose}
    >
      <div className="flex flex-col gap-3.5">
        {/* Barra di ricerca */}
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca alimento o marca (es. Latte, Yogurt, Pollo...)"
            className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#161A26] pl-11 pr-10 text-sm font-medium text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
          />
          {isSearchingRemote ? (
            <Loader2
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-emerald-400"
            />
          ) : query.length > 0 ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* Riga Filtri separata (Nessuna sovrapposizione con il pulsante Nuovo) */}
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { id: "frequent", label: "⚡ Frequenti" },
              { id: "all", label: "Tutti" },
              { id: "custom", label: "I Miei Cibi" },
              { id: "online", label: "Cloud DB" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterTab(t.id)}
              className={`truncate rounded-xl py-2 px-2 text-center text-xs font-bold transition ${
                filterTab === t.id
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border border-white/[0.04] bg-[#161A26] text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Pulsante Crea Alimento Personalizzato su riga dedicata */}
        <button
          type="button"
          onClick={onCreateCustom}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-500/35 bg-emerald-500/8 py-2.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/15"
        >
          <PlusCircle size={15} /> Crea Alimento Personalizzato
        </button>

        {/* Lista Risultati */}
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {displayedList.length === 0 && !isSearchingRemote && (
            <div className="rounded-2xl bg-[#161A26]/60 py-10 text-center">
              <p className="text-sm font-semibold text-slate-300">Nessun alimento trovato</p>
              <p className="mt-1 text-xs text-slate-500">
                Prova con un altro termine o crea un alimento personalizzato
              </p>
            </div>
          )}

          {displayedList.map((food) => {
            const previewGrams =
              food.defaultServing.unit === "portion" ? 100 : food.defaultServing.amount;
            const preview = scaleMacrosToGrams(food.macrosPer100g, previewGrams);
            const isOnline =
              String(food.id).startsWith("off-") || String(food.id).startsWith("usda-");
            const isAdded = justAddedId === food.id;
            const mealUsageCount = frequencyStats.mealCountMap.get(food.id) ?? 0;

            return (
              <div
                key={food.id}
                onClick={() => onSelect(food)}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-[#161A26] px-4 py-3 transition hover:border-emerald-500/35 hover:bg-[#1A1E2B]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{food.name}</span>
                    {mealUsageCount > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        <History size={10} /> {mealUsageCount}x
                      </span>
                    )}
                    {food.isCustom && (
                      <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                        Custom
                      </span>
                    )}
                    {isOnline && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan-500/12 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                        <Globe size={10} /> Cloud
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs font-medium text-slate-400">
                    {food.brand ? `${food.brand} • ` : ""}
                    {formatServingLabel(food.defaultServing)}
                  </p>

                  <div className="mt-1.5 flex items-center gap-3 text-xs font-medium text-slate-300 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      {preview.protein}g P
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {preview.carbs}g C
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {preview.fat}g G
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <span className="font-display block text-sm font-bold text-white tabular-nums">
                      {Math.round(preview.calories)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      kcal
                    </span>
                  </div>

                  {onQuickLog && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddClick(e, food)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                        isAdded
                          ? "border-emerald-400 bg-emerald-500 text-slate-950"
                          : "border-white/10 bg-[#12151E] text-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                      }`}
                      title="Aggiunta rapida 1-Tap"
                    >
                      {isAdded ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.5} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}