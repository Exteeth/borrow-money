import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Money Borrow",
    short_name: "MoneyBorrow",
    description: "Track borrowed and lent money between Num & Kaew",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f9",
    theme_color: "#6c5ce7",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}