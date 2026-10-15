
import type { MetadataRoute } from "next";



export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BoTrack — Diario Calorie & Macro",
    short_name: "BoTrack",
    description: "Tracciamento calorie, macronutrienti, scanner barcode e AI Vision.",
    start_url: "/",
    display: "standalone",
    background_color: "#090A0F",
    theme_color: "#090A0F",
    orientation: "portrait",
    icons: [
     {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}