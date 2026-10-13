"use client";

interface CalorieRingProps {
  current: number;
  target: number;
}

export function CalorieRing({ current, target }: CalorieRingProps) {
  const safeTarget = target > 0 ? target : 2400;
  const remaining = Math.max(0, Math.round(safeTarget - current));
  const percent = Math.min(100, Math.max(0, (current / safeTarget) * 100));

  const radius = 95;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Traccia di sfondo */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="#161c28"
          strokeWidth={strokeWidth}
        />

        {/* Bagliore Glow */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#glow)"
          opacity={0.45}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Anello di progresso principale */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* Testi centrali */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-white tabular-nums">
            {remaining.toLocaleString("it-IT")}
          </span>
          <span className="text-xl font-bold text-zinc-300">kcal</span>
        </div>
        <span className="mt-0.5 text-sm font-medium text-zinc-400">rimanenti</span>
        <span className="mt-2 text-xs font-medium text-zinc-500 tabular-nums">
          {Math.round(current).toLocaleString("it-IT")} consumate / {Math.round(safeTarget).toLocaleString("it-IT")} target
        </span>
      </div>
    </div>
  );
}
