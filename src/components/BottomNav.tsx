"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, ScanLine, Search, Target } from "lucide-react";
import { triggerHaptic } from "@/lib/mobileUtils";

export interface BottomNavProps {
  onOpenSearch?: () => void;
  onOpenTargets?: () => void;
}

export function BottomNav({ onOpenSearch, onOpenTargets }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNav = (action?: () => void) => {
    triggerHaptic("light");
    action?.();
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 px-4">
      <nav className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-3xl border border-white/[0.1] bg-[#11151F]/90 px-5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
        <button
          type="button"
          onClick={() => handleNav(() => router.push("/"))}
          className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] font-bold transition ${
            pathname === "/"
              ? "text-emerald-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Home size={20} strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span>Diario</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav(onOpenSearch)}
          className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-400 transition hover:text-white"
        >
          <Search size={20} />
          <span>Cerca</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav(() => router.push("/scanner"))}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-[0_8px_22px_rgba(16,185,129,0.4)] transition hover:brightness-110 active:scale-95"
        >
          <ScanLine size={18} strokeWidth={2.5} />
          <span>Scanner IA</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav(onOpenTargets)}
          className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-400 transition hover:text-white"
        >
          <Target size={20} />
          <span>Obiettivi</span>
        </button>
      </nav>
    </div>
  );
}

export default BottomNav;