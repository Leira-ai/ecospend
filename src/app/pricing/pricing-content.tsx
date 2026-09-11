"use client";

import Link from "next/link";
import { ArrowRight, Check, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { LeafCoin } from "@/components/brand/leaf-coin";

const comparisonFeatures = [
  { name: "Jumlah transaksi per bulan", free: "50 transaksi", pro: "Tanpa batas" },
  { name: "Jumlah akun / dompet", free: "1 akun", pro: "Tanpa batas" },
  { name: "Pencatatan pemasukan & pengeluaran", free: "Ya", pro: "Ya" },
  { name: "Estimasi karbon indikatif", free: "Dasar", pro: "Lengkap & tertelusur" },
  { name: "Impor massal CSV / Excel", free: "Maksimal 20 baris", pro: "Tanpa batas (Semua bank)" },
  { name: "Lampiran struk & bukti (10 MiB)", free: "Tidak", pro: "Ya (Private Storage)" },
  { name: "Pengingat ambang anggaran otomatis", free: "Tidak", pro: "Ya" },
  { name: "Ekspor XLSX & CSV kustom", free: "Tidak", pro: "Ya" },
  { name: "Dukungan pelanggan prioritas", free: "Komunitas", pro: "Email 24 jam" },
];

const faqs = [
  {
    q: "Apakah saya bisa membatalkan langganan kapan saja?",
    a: "Bisa. Anda dapat membatalkan langganan langsung dari menu Pengaturan kapan saja tanpa denda. Akses Pro akan tetap aktif hingga akhir periode penagihan yang telah dibayar.",
  },
  {
    q: "Bagaimana cara kerja jaminan uang kembali 14 hari?",
    a: "Jika dalam 14 hari pertama langganan Pro Anda merasa EcoSpend tidak memenuhi ekspektasi, cukup kirim email ke tim kami dan dana Anda akan dikembalikan 100% tanpa pertanyaan berbelit.",
  },
  {
    q: "Metode pembayaran apa saja yang didukung?",
    a: "Kami mendukung QRIS (GoPay, OVO, ShopeePay, DANA), Virtual Account bank-bank nasional (BCA, Mandiri, BRI, BNI), serta Kartu Kredit internasional (Visa, Mastercard, JCB, Amex) dan Apple Pay.",
  },
  {
    q: "Apakah data transaksi saya dijual kepada pihak ketiga?",
    a: "Tidak pernah. Model bisnis kami murni dari biaya langganan Pro, bukan menjual data atau menampilkan iklan pinjaman online. Data Anda terisolasi dengan enkripsi dan Row Level Security (RLS).",
  },
];

export function PricingContent() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--paper-line)] bg-[var(--paper)] px-3.5 py-1.5 text-xs font-bold text-[#1e6f4e] dark:border-emerald-400/30 dark:bg-emerald-950/70 dark:text-emerald-300">
            <LeafCoin className="size-4" />
            Transparansi Finansial & Bumi
          </div>
          <h1 className="font-display mt-6 text-balance text-4xl font-extrabold tracking-tight text-[#0e3b2c] sm:text-5xl lg:text-6xl dark:text-[#eef5ef]">
            Investasi kecil untuk kendali finansial yang utuh.
          </h1>
          <p className="mt-5 text-pretty text-lg leading-8 text-[#43544b] dark:text-[#b8c7bd]">
            Mulai gratis selamanya untuk kebutuhan dasar, atau beralih ke Pro saat Anda siap mengelola seluruh pos rekening dan jejak emisi tanpa batas.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-[var(--paper-line)] bg-[var(--paper)] p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                !isYearly
                  ? "bg-[#082419] text-white shadow dark:bg-[#1e6f4e]"
                  : "text-[#43544b] hover:text-[#0e3b2c] dark:text-[#b8c7bd] dark:hover:text-[#eef5ef]"
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${
                isYearly
                  ? "bg-[#082419] text-white shadow dark:bg-[#1e6f4e]"
                  : "text-[#43544b] hover:text-[#0e3b2c] dark:text-[#b8c7bd] dark:hover:text-[#eef5ef]"
              }`}
            >
              Tahunan
              <span className="rounded-full bg-[#d99a2b] px-2 py-0.5 text-[10px] font-extrabold text-[#082419]">
                Hemat 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Free Tier */}
          <div className="eco-paper flex flex-col justify-between rounded-[2rem] p-8 sm:p-10">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#43544b] dark:text-[#b8c7bd]">
                  Paket Dasar
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Gratis Selamanya
                </span>
              </div>
              <h2 className="font-display mt-4 text-3xl font-extrabold text-[#0e3b2c] dark:text-[#eef5ef]">
                Pemula
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#43544b] dark:text-[#b8c7bd]">
                Cocok untuk mahasiswa atau siapa saja yang ingin mulai membiasakan diri mencatat alur kas harian.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold text-[#0e3b2c] dark:text-[#eef5ef]">
                  Rp0
                </span>
                <span className="text-sm font-medium text-[#43544b] dark:text-[#b8c7bd]">
                  / selamanya
                </span>
              </div>

              <ul className="mt-8 space-y-3.5 border-t border-[var(--paper-line)] pt-8 text-sm">
                {[
                  "1 akun dompet atau rekening bank",
                  "Hingga 50 transaksi per bulan",
                  "Kategori belanja dasar dan arus kas",
                  "Estimasi karbon indikatif per pos",
                  "Mode demo lokal tanpa registrasi",
                  "Dapat dipasang sebagai PWA di HP",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[#33423a] dark:text-[#d4ded8]">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--paper-line)] bg-white px-6 py-3 font-bold text-[#0e3b2c] shadow-sm transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] dark:bg-[#0c1a13] dark:text-[#eef5ef] dark:hover:bg-white/10"
              >
                Mulai Gratis Sekarang
              </Link>
            </div>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] border-2 border-[#1e6f4e] bg-[#082419] p-8 text-white shadow-2xl shadow-emerald-950/25 sm:p-10 dark:border-[#57c87a]">
            <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8ef87]">
                  Paling Direkomendasikan
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-lime-300/20 px-3 py-1 text-xs font-bold text-lime-300">
                  <Sparkles className="size-3" /> Pro Akses Penuh
                </span>
              </div>
              <h2 className="font-display mt-4 text-3xl font-extrabold text-white">
                EcoSpend Pro
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                Semua instrumen yang Anda butuhkan untuk perencanaan finansial disiplin dan audit dampak karbon menyeluruh.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold text-white">
                  {isYearly ? "Rp29.000" : "Rp39.000"}
                </span>
                <span className="text-sm font-medium text-emerald-100/70">
                  / bulan {isYearly && "(ditagih tahunan Rp348.000)"}
                </span>
              </div>

              <ul className="mt-8 space-y-3.5 border-t border-white/15 pt-8 text-sm">
                {[
                  "Akun & dompet keuangan tak terbatas (Bank, e-Wallet, Tunai)",
                  "Transaksi bulanan tanpa batas kuota",
                  "Impor mutasi massal CSV & Excel (BCA, Mandiri, Jenius, dll)",
                  "Lampiran foto struk privat terenkripsi (10 MiB per nota)",
                  "Analitik jejak karbon mendalam & rincian faktor emisi",
                  "Pengingat ambang batas anggaran pintar (80% & 100%)",
                  "Ekspor data lengkap ke XLSX & CSV kustom",
                  "Dukungan prioritas lewat jalur email langsung",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-emerald-50">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lime-300 text-[#082419]">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mt-10">
              <Link
                href="/register?plan=pro"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 px-6 py-3 font-bold text-[#082419] shadow-lg shadow-black/20 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Tingkatkan ke Pro <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <p className="mt-3 text-center text-xs text-emerald-100/60">
                Garansi uang kembali 14 hari tanpa syarat. Batalkan kapan saja.
              </p>
            </div>
          </div>
        </div>

        {/* Guarantee Banner */}
        <div className="mt-16 flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--paper-line)] bg-[var(--paper)] p-6 text-center sm:flex-row sm:text-left">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0e3b2c] dark:text-[#eef5ef]">
              14 Hari Garansi Kepuasan Penuh
            </h3>
            <p className="mt-0.5 text-sm text-[#43544b] dark:text-[#b8c7bd]">
              Jika EcoSpend Pro tidak membantu Anda lebih sadar finansial dalam 14 hari pertama, kami kembalikan seluruh dana Anda tanpa potongan.
            </p>
          </div>
        </div>

        {/* Payment Methods Supported (Hybrid Indonesia + Global) */}
        <div className="mt-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#43544b] dark:text-[#b8c7bd]">
            Metode Pembayaran Resmi yang Didukung (Otomatis & Terverifikasi)
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#43544b] dark:text-[#b8c7bd]">
            {[
              "QRIS (Semua e-Wallet)",
              "BCA Virtual Account",
              "Mandiri Virtual Account",
              "BRI Virtual Account",
              "BNI Virtual Account",
              "Visa & Mastercard",
              "Apple Pay & Google Pay",
            ].map((method) => (
              <span
                key={method}
                className="rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] px-3.5 py-2 shadow-xs"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <h2 className="font-display text-center text-3xl font-extrabold text-[#0e3b2c] dark:text-[#eef5ef]">
            Komparasi Fitur Lengkap
          </h2>
          <p className="mt-2 text-center text-sm text-[#43544b] dark:text-[#b8c7bd]">
            Bandingkan kebutuhan Anda antara paket Pemula dan paket Pro.
          </p>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--paper-line)] bg-[var(--paper)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--paper-line)] bg-black/[0.02] dark:bg-white/[0.02]">
                  <th className="px-6 py-4 font-bold text-[#0e3b2c] dark:text-[#eef5ef]">Fitur</th>
                  <th className="w-44 px-6 py-4 font-bold text-[#0e3b2c] dark:text-[#eef5ef]">Pemula</th>
                  <th className="w-56 px-6 py-4 font-bold text-[#1e6f4e] dark:text-[#8bd3a7]">EcoSpend Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--paper-line)]">
                {comparisonFeatures.map((item) => (
                  <tr key={item.name} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                    <td className="px-6 py-4 font-medium text-[#33423a] dark:text-[#d4ded8]">{item.name}</td>
                    <td className="px-6 py-4 text-[#43544b] dark:text-[#b8c7bd]">{item.free}</td>
                    <td className="px-6 py-4 font-semibold text-[#1e6f4e] dark:text-[#8bd3a7]">{item.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20">
          <h2 className="font-display text-center text-3xl font-extrabold text-[#0e3b2c] dark:text-[#eef5ef]">
            Pertanyaan yang Sering Diajukan
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="eco-paper rounded-2xl p-6 transition"
              >
                <h3 className="flex items-start gap-2.5 font-bold text-[#0e3b2c] dark:text-[#eef5ef]">
                  <HelpCircle className="mt-0.5 size-5 shrink-0 text-[#1e6f4e] dark:text-[#8bd3a7]" />
                  <span>{faq.q}</span>
                </h3>
                <p className="mt-3 pl-7 text-sm leading-6 text-[#43544b] dark:text-[#b8c7bd]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
