"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, ScanLine, Search, Target } from "lucide-react";
import { triggerHaptic } from "@/lib/mobileUtils";

interface BottomNavProps {
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#090A0F]/85 px-6 pb-5 pt-2.5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <button
          type="button"
          onClick={() => handleNav(() => router.push("/"))}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition ${
            pathname === "/" ? "text-emerald-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Home size={20} />
          <span>Diario</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav(onOpenSearch)}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-400 transition hover:text-white"
        >
          <Search size={20} />
          <span>Cerca</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav(() => router.push("/scanner"))}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:brightness-110 active:scale-95"
        >
          <ScanLine size={18} strokeWidth={2.5} />
          <span>Scanner IA</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav(onOpenTargets)}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-400 transition hover:text-white"
        >
          <Target size={20} />
          <span>Obiettivi</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;