import type { Metadata } from "next";
import { PricingContent } from "./pricing-content";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "Pilihan Paket & Harga — EcoSpend",
  description: "Pilih paket gratis selamanya atau paket Pro untuk pencatatan keuangan tanpa batas, analitik karbon mendalam, dan impor bank massal.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <PricingContent />
      </main>
      <SiteFooter />
    </div>
  );
}
