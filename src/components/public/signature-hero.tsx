import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { FlowMark } from "@/components/brand/flow-mark";
import { LeafCoin } from "@/components/brand/leaf-coin";
import { DashboardPreview } from "./dashboard-preview";
import { Reveal } from "./reveal";

const promises = ["Gratis untuk memulai", "Tanpa iklan", "Privasi sebagai dasar"];

export function SignatureHero() {
  return (
    <section className="texture-flow relative overflow-hidden border-b border-[var(--paper-line)] bg-[#f6f4ec] px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:px-10 lg:pb-32 lg:pt-24 dark:bg-[#08130e]">
      <div className="pointer-events-none absolute -left-28 top-10 size-[28rem] rounded-full bg-[#8fcf9d]/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 top-28 size-[30rem] rounded-full bg-[#e3bb68]/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <Reveal>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1e6f4e]/20 bg-[#fbf9f3]/90 px-3 py-1.5 text-xs font-bold text-[#1e6f4e] shadow-sm backdrop-blur dark:border-emerald-400/30 dark:bg-emerald-950/70 dark:text-emerald-200">
                <LeafCoin className="size-5" />
                Jurnal keuangan hidup
              </div>
              <h1 className="font-display mt-6 text-balance text-[3.25rem] leading-[0.98] text-[#0e3b2c] sm:text-6xl lg:text-[4.75rem] dark:text-[#eef5ef]">
                Tiap rupiah punya <span className="relative whitespace-nowrap text-[#1e6f4e] dark:text-[#8bd3a7]">cerita.<svg className="absolute -bottom-2 left-0 h-3 w-full" viewBox="0 0 260 14" fill="none" aria-hidden="true"><path d="M2 10c51-8 94 5 143-3 45-8 79 1 113-5" stroke="#D99A2B" strokeWidth="4" strokeLinecap="round" /></svg></span>
                <br />Bumi ikut merasakannya.
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-[#43544b] dark:text-[#c4d2c9]">
                Catat pengeluaran seperti biasa. EcoSpend merangkainya menjadi pola keuangan dan estimasi dampak yang mudah dipahami—tanpa menghakimi pilihan Anda.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#082419] px-6 py-3 font-bold text-white shadow-[0_18px_36px_-16px_rgb(14_59_44/0.85)] transition hover:-translate-y-0.5 hover:bg-[#0e3b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] focus-visible:ring-offset-2 motion-reduce:transform-none dark:bg-[#1e6f4e] dark:hover:bg-[#2fa36b] dark:text-white">
                  Mulai jurnalmu <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                </Link>
                <Link href="/dashboard?demo=1" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#0e3b2c]/20 bg-white px-6 py-3 font-bold text-[#082419] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#1e6f4e]/40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] motion-reduce:transform-none dark:border-white/20 dark:bg-[#0c1a13] dark:text-[#eef5ef] dark:hover:bg-[#14261d]">
                  <Sparkles className="size-4" aria-hidden="true" /> Coba demo
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#43544b] dark:text-[#c4d2c9]">
                {promises.map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-[#1e6f4e] dark:text-[#8bd3a7]" aria-hidden="true" />{item}</span>)}
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-[#0e3b2c]/10 pt-5 text-xs text-[#43544b] dark:border-white/10 dark:text-[#c4d2c9]">
                <ShieldCheck className="size-4 text-[#1e6f4e] dark:text-[#8bd3a7]" aria-hidden="true" />
                <span>Data pribadi dipisahkan per akun dengan RLS.</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={140}><DashboardPreview /></Reveal>
        </div>
        <FlowMark className="pointer-events-none absolute -bottom-24 left-0 hidden h-28 w-full opacity-45 lg:block" />
      </div>
    </section>
  );
}
