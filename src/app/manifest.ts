import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MacroTrack — Diario Calorie & Macro",
    short_name: "MacroTrack",
    description: "Tracciamento calorie, macronutrienti, scanner barcode e AI Vision.",
    start_url: "/",
    display: "standalone",
    background_color: "#090A0F",
    theme_color: "#090A0F",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}