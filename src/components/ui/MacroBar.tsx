import type { MacroKey } from "@/lib/food/theme";
import { MACRO_STYLES } from "@/lib/food/theme";

interface MacroBarProps {
  macro: MacroKey;
  current: number;
  target: number;
}

export function MacroBar({ macro, current, target }: MacroBarProps) {
  const style = MACRO_STYLES[macro];
  const safeTarget = target > 0 ? target : 1;
  const percent = Math.min(100, Math.round((current / safeTarget) * 100));
  const isOver = current > target && target > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${style.text}`}>{style.label}</span>
        <span className="text-zinc-400">
          <span className="font-medium text-zinc-200">
            {Number.isInteger(current) ? current : current.toFixed(1)}
          </span>
          {" / "}
          {Math.round(target)}
          {style.unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isOver ? "bg-rose-500" : style.bg
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
