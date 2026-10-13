export type MacroKey = "calories" | "protein" | "carbs" | "fat";

interface MacroStyle {
  label: string;
  unit: string;
  text: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
}

export const MACRO_STYLES: Record<MacroKey, MacroStyle> = {
  calories: {
    label: "Calories",
    unit: "kcal",
    text: "text-sky-400",
    bg: "bg-sky-500",
    bgSoft: "bg-sky-500/15",
    border: "border-sky-500/30",
    ring: "ring-sky-500/40",
  },
  protein: {
    label: "Protein",
    unit: "g",
    text: "text-emerald-400",
    bg: "bg-emerald-500",
    bgSoft: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/40",
  },
  carbs: {
    label: "Carbs",
    unit: "g",
    text: "text-amber-400",
    bg: "bg-amber-500",
    bgSoft: "bg-amber-500/15",
    border: "border-amber-500/30",
    ring: "ring-amber-500/40",
  },
  fat: {
    label: "Fat",
    unit: "g",
    text: "text-rose-400",
    bg: "bg-rose-500",
    bgSoft: "bg-rose-500/15",
    border: "border-rose-500/30",
    ring: "ring-rose-500/40",
  },
};

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};
