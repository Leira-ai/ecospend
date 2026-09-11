"use client";

import Link from "next/link";
import { ArrowRight, Leaf, RotateCcw, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

const categories = [
  { id: "food", label: "Makan & minum", icon: "🍜", factor: 0.0018, unit: "per Rp1.000" },
  { id: "transport", label: "Transportasi", icon: "🚌", factor: 0.0012, unit: "per Rp1.000" },
  { id: "shopping", label: "Belanja barang", icon: "🛍️", factor: 0.0015, unit: "per Rp1.000" },
  { id: "utilities", label: "Listrik & tagihan", icon: "⚡", factor: 0.0009, unit: "per Rp1.000" },
  { id: "other", label: "Lainnya", icon: "📦", factor: 0.001, unit: "per Rp1.000" },
] as const;

function formatKg(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
}

export function EmissionsCalculator() {
  const [categoryId, setCategoryId] = useState<(typeof categories)[number]["id"]>("food");
  const [amount, setAmount] = useState("500000");
  const [hasCalculated, setHasCalculated] = useState(false);

  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  const estimatedKg = useMemo(() => {
    const value = Number(amount.replace(/[^0-9]/g, ""));
    return Number.isFinite(value) && value > 0 ? (value / 1000) * category.factor : 0;
  }, [amount, category.factor]);

  const calculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasCalculated(true);
  };

  const reset = () => {
    setAmount("500000");
    setCategoryId("food");
    setHasCalculated(false);
  };

  const share = async () => {
    const text = `Saya baru menghitung estimasi ${formatKg(estimatedKg)} kg CO₂e dari pengeluaran saya di EcoSpend.`;
    if (navigator.share) await navigator.share({ title: "Kalkulator Jejak Karbon EcoSpend", text, url: window.location.href });
    else await navigator.clipboard?.writeText(`${text} ${window.location.href}`);
  };

  return (
    <div className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/70 dark:text-emerald-300"><Leaf className="size-4" /> Lead magnet EcoSpend</span>
            <h1 className="font-display mt-6 text-balance text-4xl font-extrabold tracking-tight text-[#0e3b2c] sm:text-5xl dark:text-[#eef5ef]">Seberapa besar jejak bumi dari rupiah Anda?</h1>
            <p className="mt-5 text-lg leading-8 text-[#43544b] dark:text-[#b8c7bd]">Coba hitung cepat estimasi indikatif dari satu kategori belanja. Tidak perlu login, tidak ada data yang disimpan.</p>
            <div className="mt-8 space-y-3 text-sm text-[#43544b] dark:text-[#c4d2c9]"><p>✓ Hasil langsung dalam kilogram CO₂e</p><p>✓ Faktor demonstrasi transparan</p><p>✓ Bukan audit atau klaim net-zero</p></div>
          </div>

          <div className="eco-paper rounded-[2rem] p-6 sm:p-8">
            <form onSubmit={calculate} className="space-y-6">
              <div><label htmlFor="emissions-category" className="mb-2 block text-sm font-bold text-[#0e3b2c] dark:text-[#eef5ef]">Kategori pengeluaran</label><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{categories.map((item) => <button key={item.id} type="button" onClick={() => { setCategoryId(item.id); setHasCalculated(false); }} className={`flex min-h-16 flex-col items-center justify-center rounded-xl border p-2 text-center transition ${categoryId === item.id ? "border-emerald-700 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-700/20 dark:border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200" : "border-[var(--paper-line)] text-[#43544b] hover:bg-black/5 dark:text-[#b8c7bd] dark:hover:bg-white/5"}`}><span className="text-xl" aria-hidden="true">{item.icon}</span><span className="mt-1 text-xs font-semibold">{item.label}</span></button>)}</div></div>
              <div><label htmlFor="emissions-amount" className="mb-2 block text-sm font-bold text-[#0e3b2c] dark:text-[#eef5ef]">Total pengeluaran kategori ini (Rupiah)</label><div className="relative"><span className="pointer-events-none absolute left-4 top-3 text-sm font-bold text-[#43544b] dark:text-[#b8c7bd]">Rp</span><input id="emissions-amount" type="number" min="0" step="1000" value={amount} onChange={(event) => { setAmount(event.target.value); setHasCalculated(false); }} className="min-h-12 w-full rounded-xl border border-[var(--paper-line)] bg-[var(--background)] pl-12 pr-4 text-lg font-bold text-[#0e3b2c] outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 dark:text-[#eef5ef]" /></div><p className="mt-2 text-xs text-[#43544b] dark:text-[#b8c7bd]">Faktor demo: {category.factor.toFixed(4)} kg CO₂e {category.unit}.</p></div>
              <div className="flex gap-3"><button type="submit" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#082419] px-5 font-bold text-white transition hover:bg-[#0e3b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-[#1e6f4e] dark:hover:bg-[#2fa36b]">Hitung estimasi <ArrowRight className="size-4" /></button><button type="button" onClick={reset} aria-label="Reset kalkulator" className="grid size-12 shrink-0 place-items-center rounded-xl border border-[var(--paper-line)] text-[#43544b] transition hover:bg-black/5 dark:text-[#b8c7bd] dark:hover:bg-white/10"><RotateCcw className="size-4" /></button></div>
            </form>

            {hasCalculated && <div role="status" className="mt-6 rounded-2xl bg-[#082419] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-300">Hasil indikatif</p><p className="font-display mt-2 text-4xl font-extrabold">{formatKg(estimatedKg)} kg CO₂e</p><p className="mt-2 text-sm leading-6 text-emerald-100/75">Perkiraan ini menggunakan faktor demonstrasi EcoSpend. Hasil nyata dipengaruhi jenis produk, wilayah, metode, dan kualitas data.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void share()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"><Share2 className="size-4" />Bagikan hasil</button><Link href="/register" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-bold text-[#082419] hover:bg-lime-200">Jurnal lengkap <ArrowRight className="size-4" /></Link></div></div>}
          </div>
        </div>
        <p className="mx-auto mt-16 max-w-2xl text-center text-xs leading-5 text-[#43544b] dark:text-[#8a9a92]">Kalkulator ini hanya untuk edukasi dan demonstrasi. Jangan gunakan sebagai pengukuran langsung, dasar pelaporan regulasi, sertifikasi, keputusan investasi, atau klaim lingkungan.</p>
      </div>
    </div>
  );
}
