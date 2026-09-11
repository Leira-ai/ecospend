import type { Metadata } from "next";
import { EmissionsCalculator } from "./emissions-calculator";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "Kalkulator Jejak Karbon Pengeluaran — EcoSpend",
  description: "Hitung estimasi jejak karbon indikatif dari pengeluaran harian Anda secara gratis, tanpa login.",
  alternates: { canonical: "/kalkulator-emisi" },
};

export default function EmissionsCalculatorPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <EmissionsCalculator />
      </main>
      <SiteFooter />
    </div>
  );
}
