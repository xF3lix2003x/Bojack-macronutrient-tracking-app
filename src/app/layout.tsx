import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MacroTrack — Calorie & Macro Tracker",
  description: "Tracciamento calorie e macronutrienti con scanner Open Food Facts.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MacroTrack",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body className="bg-[#090a0f] text-zinc-100 antialiased select-none overscroll-none">
        {children}
      </body>
    </html>
  );
}