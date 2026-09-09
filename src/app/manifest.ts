import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EcoSpend — Keuangan & Jejak Karbon",
    short_name: "EcoSpend",
    description: "Catat keuangan, jaga anggaran, dan pahami perkiraan jejak karbon dari pengeluaran Anda.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f9f4",
    theme_color: "#065f46",
    lang: "id-ID",
    categories: ["finance", "lifestyle", "utilities"],
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Buka dasbor", short_name: "Dasbor", description: "Lihat ringkasan keuangan", url: "/dashboard" },
      { name: "Catat transaksi", short_name: "Transaksi", description: "Buka pencatatan transaksi", url: "/dashboard/transaksi" },
    ],
  };
}
