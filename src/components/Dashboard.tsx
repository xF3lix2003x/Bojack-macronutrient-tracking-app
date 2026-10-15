"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  MealEntry,
  DailyTarget,
  Macros,
  MealType,
  FoodItem,
  ServingUnit,
} from "@/lib/food/schemas";
import { MEAL_TYPES } from "@/lib/food/schemas";
import { sumMealEntryMacros } from "@/lib/food/nutrition";
import { useFoodStore } from "@/store/useFoodStore";
import { MacroCoachCard } from "@/components/MacroCoachCard";
import BottomNav from "@/components/BottomNav";
import { MealList } from "@/components/MealList";
import { WellnessStrip } from "@/components/WellnessStrip";
import { FoodSearchModal } from "@/components/FoodSearchModal";
import { ServingSizeSelectorModal } from "@/components/ServingSizeSelectorModal";
import { CustomFoodCreatorModal } from "@/components/CustomFoodCreatorModal";
import {
  TargetsModal,
  type MacroCyclingConfig,
} from "@/components/TargetsModal";
import {
  Award,
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Moon,
} from "lucide-react";
import { triggerHaptic } from "@/lib/mobileUtils";

interface DashboardProps {
  initialEntries?: MealEntry[];
  initialTarget?: DailyTarget;
}

function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function Dashboard({
  initialEntries = [],
  initialTarget = { calories: 2200, protein: 160, carbs: 220, fat: 70 },
}: DashboardProps) {
  const store = useFoodStore() as Record<string, any>;
  const storeEntries = useFoodStore((state) => state.mealEntries);
  const hydrate = useFoodStore((state) => state.hydrate);
  const logMealItem = useFoodStore((state) => state.logMealItem);
  const createCustomFood = useFoodStore((state) => state.createCustomFood);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const [dailyTarget, setDailyTarget] = useState<DailyTarget>(
    (store.dailyTarget as DailyTarget) ?? initialTarget
  );
  const [cyclingConfig, setCyclingConfig] = useState<MacroCyclingConfig>({
    enabled: false,
    activeDayType: "on",
    onDay: initialTarget,
    offDay: {
      calories: 1900,
      protein: 160,
      carbs: 150,
      fat: 75,
    },
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);

  useEffect(() => {
    void hydrate();
    try {
      const savedTarget = localStorage.getItem("botrack-daily-target");
      if (savedTarget) {
        setDailyTarget(JSON.parse(savedTarget) as DailyTarget);
      }
      const savedCycling = localStorage.getItem("botrack-cycling-config");
      if (savedCycling) {
        setCyclingConfig(JSON.parse(savedCycling) as MacroCyclingConfig);
      }
    } catch {
      // Ignora errori localStorage
    }
  }, [hydrate]);

  const handleSaveTargets = (
    newTarget: DailyTarget,
    newCycling: MacroCyclingConfig
  ) => {
    setDailyTarget(newTarget);
    setCyclingConfig(newCycling);
    try {
      localStorage.setItem("botrack-daily-target", JSON.stringify(newTarget));
      localStorage.setItem(
        "botrack-cycling-config",
        JSON.stringify(newCycling)
      );
    } catch {
      // Ignora
    }
    if (typeof store.setDailyTarget === "function") {
      void store.setDailyTarget(newTarget);
    } else if (typeof store.updateDailyTarget === "function") {
      void store.updateDailyTarget(newTarget);
    }
  };

  const toggleDayTypeOnOff = () => {
    triggerHaptic("light");
    const nextType = cyclingConfig.activeDayType === "on" ? "off" : "on";
    const nextTarget =
      nextType === "on" ? cyclingConfig.onDay : cyclingConfig.offDay;
    const updatedCycling: MacroCyclingConfig = {
      ...cyclingConfig,
      activeDayType: nextType,
    };
    handleSaveTargets(nextTarget, updatedCycling);
  };

  const activeEntries: MealEntry[] =
    storeEntries && storeEntries.length > 0 ? storeEntries : initialEntries;

  // Genera i 7 giorni della settimana corrente (Lun - Dom)
  const weekDays = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const days = [];
    const loggedDates = new Set(
      activeEntries.map((e) => (e.loggedAt ? e.loggedAt.split("T")[0] : todayKey))
    );

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = toDateKey(d);
      const dayLabel = new Intl.DateTimeFormat("it-IT", {
        weekday: "short",
      })
        .format(d)
        .slice(0, 1)
        .toUpperCase();

      days.push({
        key,
        dayName: dayLabel,
        dayNumber: d.getDate(),
        isToday: key === todayKey,
        hasEntries: loggedDates.has(key),
      });
    }
    return days;
  }, [weekOffset, activeEntries, todayKey]);

  const selectedEntries = useMemo(() => {
    return activeEntries.filter((e) => {
      if (!e.loggedAt) return selectedDateKey === todayKey;
      return e.loggedAt.startsWith(selectedDateKey);
    });
  }, [activeEntries, selectedDateKey, todayKey]);

  const previousDayEntries = useMemo(() => {
    const [y, m, d] = selectedDateKey.split("-").map(Number);
    const prevDate = new Date(y, m - 1, d - 1);
    const prevKey = toDateKey(prevDate);
    return activeEntries.filter((e) => e.loggedAt?.startsWith(prevKey));
  }, [activeEntries, selectedDateKey]);

  const activeDaysStreak = useMemo(() => {
    const uniqueDays = new Set(
      activeEntries.map((e) => (e.loggedAt ? e.loggedAt.split("T")[0] : todayKey))
    );
    return Math.max(1, uniqueDays.size);
  }, [activeEntries, todayKey]);

  const totals: Macros = useMemo(
    () => sumMealEntryMacros(selectedEntries),
    [selectedEntries]
  );

  const entriesByMealType = useMemo(() => {
    return MEAL_TYPES.reduce((acc, type) => {
      acc[type] = selectedEntries.filter((e) => e.mealType === type);
      return acc;
    }, {} as Record<MealType, MealEntry[]>);
  }, [selectedEntries]);

  const yesterdayEntriesByMealType = useMemo(() => {
    return MEAL_TYPES.reduce((acc, type) => {
      acc[type] = previousDayEntries.filter((e) => e.mealType === type);
      return acc;
    }, {} as Record<MealType, MealEntry[]>);
  }, [previousDayEntries]);

  const handleRemoveEntry = async (id: string) => {
    if (typeof store.removeMealEntry === "function") {
      await store.removeMealEntry(id);
    } else if (typeof store.removeMealItem === "function") {
      await store.removeMealItem(id);
    } else if (typeof store.deleteMealEntry === "function") {
      await store.deleteMealEntry(id);
    }
  };

  const buildLoggedAtIso = () => {
    if (selectedDateKey === todayKey) return new Date().toISOString();
    return `${selectedDateKey}T12:00:00.000Z`;
  };

  const handleConfirmServing = async (payload: {
    servingUnit: ServingUnit;
    servingAmount: number;
    mealType: MealType;
  }) => {
    if (editingEntry) {
      await handleRemoveEntry(editingEntry.id);
      await logMealItem({
        foodItem: editingEntry.foodItem,
        loggedServing: {
          unit: payload.servingUnit,
          amount: payload.servingAmount,
        },
        mealType: payload.mealType,
        loggedAt: editingEntry.loggedAt ?? buildLoggedAtIso(),
      } as any);
      setEditingEntry(null);
      return;
    }

    if (selectedFood) {
      await logMealItem({
        foodItem: selectedFood,
        loggedServing: {
          unit: payload.servingUnit,
          amount: payload.servingAmount,
        },
        mealType: payload.mealType,
        loggedAt: buildLoggedAtIso(),
      } as any);
      setSelectedFood(null);
      setIsSearchOpen(false);
    }
  };

  const handleRepeatYesterdayMeal = async (
    mealType: MealType,
    entries: MealEntry[]
  ) => {
    for (const entry of entries) {
      await logMealItem({
        foodItem: entry.foodItem,
        loggedServing: entry.loggedServing,
        mealType,
        loggedAt: buildLoggedAtIso(),
      } as any);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] pb-32 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar Premium BoTrack + Striscia Calendario Settimanale */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080A0F]/85 px-5 pb-3 pt-3.5 backdrop-blur-2xl">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-cyan-400 font-black text-slate-950 shadow-[0_6px_20px_rgba(16,185,129,0.3)]">
                <span className="text-base tracking-tighter">B</span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#080A0F]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-white">
                    BoTrack
                  </h1>
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                    PRO
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400">
                  {selectedDateKey === todayKey
                    ? "Diario di oggi"
                    : `Data: ${selectedDateKey}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Switch Rapido ON / OFF se il Macro Cycling è attivo */}
              {cyclingConfig.enabled && (
                <button
                  type="button"
                  onClick={toggleDayTypeOnOff}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-extrabold transition ${
                    cyclingConfig.activeDayType === "on"
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                  }`}
                  title="Cambia tra Giorno ON e Giorno OFF"
                >
                  {cyclingConfig.activeDayType === "on" ? (
                    <Dumbbell size={13} />
                  ) : (
                    <Moon size={13} />
                  )}
                  <span className="uppercase">{cyclingConfig.activeDayType}</span>
                </button>
              )}

              {/* Pillola Streak Costanza */}
              <div
                className="flex items-center gap-1 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-xs font-extrabold text-amber-300"
                title="Giorni di tracciamento attivo"
              >
                <Flame size={14} className="fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{activeDaysStreak}g</span>
              </div>

              {/* Bottone Target Calorico */}
              <button
                type="button"
                onClick={() => setIsTargetsOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#11151F] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-emerald-500/40 hover:bg-[#181D2B] active:scale-95"
              >
                <Award size={14} className="text-emerald-400" />
                <span className="tabular-nums">{dailyTarget.calories} kcal</span>
              </button>
            </div>
          </div>

          {/* Striscia Calendario Settimanale (Fase 1 Quick Win) */}
          <div className="mt-3 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="flex h-8 w-7 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.05] hover:text-white"
              aria-label="Settimana precedente"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="grid flex-1 grid-cols-7 gap-1">
              {weekDays.map((d) => {
                const isSelected = d.key === selectedDateKey;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedDateKey(d.key);
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-2xl py-1.5 transition ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950 font-extrabold shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                        : d.isToday
                        ? "border border-emerald-500/40 bg-[#11151F] text-emerald-300 font-bold"
                        : "bg-[#11151F]/60 text-slate-400 hover:bg-[#181D2B] hover:text-white"
                    }`}
                  >
                    <span className="text-[10px] uppercase opacity-80">
                      {d.dayName}
                    </span>
                    <span className="font-display text-xs font-extrabold tabular-nums">
                      {d.dayNumber}
                    </span>
                    {d.hasEntries && (
                      <span
                        className={`mt-0.5 h-1 w-1 rounded-full ${
                          isSelected ? "bg-slate-950" : "bg-emerald-400"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="flex h-8 w-7 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.05] hover:text-white"
              aria-label="Settimana successiva"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenuto Principale */}
      <main className="mx-auto max-w-md space-y-5 px-5 pt-5">
        {/* 1. HERO DATA VISUALIZATION */}
        <MacroCoachCard
          totals={totals}
          target={dailyTarget}
          allEntries={selectedEntries}
        />

        {/* 2. WELLNESS STRIP */}
        <WellnessStrip dateKey={selectedDateKey} />

        {/* 3. DIARIO PASTI */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white">
                Diario Pasti
              </h2>
              <p className="text-xs font-medium text-slate-400">
                Tocca <span className="font-bold text-emerald-400">+</span> su un pasto per registrare
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-[#11151F] px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-500/35 hover:bg-[#181D2B]"
            >
              <Sparkles size={13} className="text-emerald-400" />
              <span>Crea Cibo</span>
            </button>
          </div>

          <MealList
            entriesByMealType={entriesByMealType}
            yesterdayEntriesByMealType={yesterdayEntriesByMealType}
            onAddToMeal={(mealType) => {
              setSelectedMealType(mealType);
              setIsSearchOpen(true);
            }}
            onRemove={(id) => void handleRemoveEntry(id)}
            onEditEntry={(entry) => setEditingEntry(entry)}
            onRepeatYesterdayMeal={(mealType, entries) =>
              void handleRepeatYesterdayMeal(mealType, entries)
            }
          />
        </section>
      </main>

      {/* Modale Ricerca Alimenti */}
      {isSearchOpen && (
        <FoodSearchModal
          mealType={selectedMealType}
          onClose={() => setIsSearchOpen(false)}
          onSelect={(food) => setSelectedFood(food)}
          onQuickLog={(food) => {
            void logMealItem({
              foodItem: food,
              loggedServing: food.defaultServing,
              mealType: selectedMealType,
              loggedAt: buildLoggedAtIso(),
            } as any);
          }}
          onCreateCustom={() => {
            setIsSearchOpen(false);
            setIsCustomModalOpen(true);
          }}
        />
      )}

      {/* Modale Scelta Porzione / Modifica Voce */}
      {(selectedFood || editingEntry) && (
        <ServingSizeSelectorModal
          foodItem={(editingEntry ? editingEntry.foodItem : selectedFood)!}
          initialMealType={
            editingEntry ? editingEntry.mealType : selectedMealType
          }
          initialServingUnit={
            editingEntry
              ? editingEntry.loggedServing.unit
              : selectedFood?.defaultServing.unit
          }
          initialServingAmount={
            editingEntry
              ? editingEntry.loggedServing.amount
              : selectedFood?.defaultServing.amount
          }
          isEditing={Boolean(editingEntry)}
          onClose={() => {
            setSelectedFood(null);
            setEditingEntry(null);
          }}
          onConfirm={handleConfirmServing}
        />
      )}

      {/* Modale Creazione Cibo Personalizzato */}
      {isCustomModalOpen && (
        <CustomFoodCreatorModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          onCreated={(food) => {
            void createCustomFood({
              name: food.name,
              brand: food.brand,
              barcode: food.barcode,
              servingUnit: food.defaultServing.unit,
              servingAmount: food.defaultServing.amount,
              caloriesPer100g: food.macrosPer100g.calories,
              proteinPer100g: food.macrosPer100g.protein,
              carbsPer100g: food.macrosPer100g.carbs,
              fatPer100g: food.macrosPer100g.fat,
            });
            setIsCustomModalOpen(false);
            setSelectedFood(food);
          }}
        />
      )}

      {/* Modale Obiettivi & Calcolatore TDEE */}
      <TargetsModal
        isOpen={isTargetsOpen}
        currentTarget={dailyTarget}
        cyclingConfig={cyclingConfig}
        onClose={() => setIsTargetsOpen(false)}
        onSave={handleSaveTargets}
      />

      <BottomNav
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTargets={() => setIsTargetsOpen(true)}
      />
    </div>
  );
}

export default Dashboard;