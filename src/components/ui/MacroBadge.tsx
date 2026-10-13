import type { MacroKey } from "@/lib/food/theme";
import { MACRO_STYLES } from "@/lib/food/theme";

interface MacroBadgeProps {
  macro: MacroKey;
  value: number;
  compact?: boolean;
}

export function MacroBadge({ macro, value, compact = false }: MacroBadgeProps) {
  const style = MACRO_STYLES[macro];
  const displayValue = Number.isInteger(value) ? value : value.toFixed(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.border} ${style.bgSoft} ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } font-medium ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.bg}`} />
      {displayValue}
      {style.unit}
      {!compact && <span className="text-zinc-500">{style.label}</span>}
    </span>
  );
}
