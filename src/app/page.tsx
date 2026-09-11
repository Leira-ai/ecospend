import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  Fingerprint,
  Gauge,
  Leaf,
  LineChart,
  LockKeyhole,
  PiggyBank,
  ReceiptText,
  Scale,
  ShieldCheck,
  Target,
  WalletCards,
} from "lucide-react";
import { LandingCta } from "@/components/public/landing-cta";
import { ProofMarquee } from "@/components/public/proof-marquee";
import { PwaRegister } from "@/components/public/pwa-register";
import { Reveal } from "@/components/public/reveal";
import { SectionHeading } from "@/components/public/section-heading";
import { SignatureHero } from "@/components/public/signature-hero";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "EcoSpend — Pahami Uang, Kenali Dampaknya",
  description: "Catat keuangan, jaga anggaran, dan pahami perkiraan jejak karbon dari pengeluaran Anda dalam satu dasbor.",
};

const benefits = [
  { icon: Eye, title: "Lebih mudah dipahami", text: "Satu tampilan untuk arus uang, anggaran, dan perkiraan emisi agar pola penting tidak terlewat." },
  { icon: Target, title: "Lebih terarah", text: "Susun batas belanja realistis dan lihat progresnya sebelum pengeluaran melewati rencana." },
  { icon: Leaf, title: "Lebih sadar dampak", text: "Pelajari kategori yang berkontribusi pada estimasi CO₂e tanpa menghakimi pilihan Anda." },
] as const;

const steps = [
  { number: "01", title: "Catat transaksi", text: "Masukkan pemasukan dan pengeluaran, lalu pilih kategori yang sesuai." },
  { number: "02", title: "Tetapkan arah", text: "Buat anggaran dan tujuan yang relevan dengan kehidupan sehari-hari." },
  { number: "03", title: "Pelajari polanya", text: "Baca ringkasan finansial dan estimasi karbon, lalu putuskan langkah berikutnya." },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f9f4] text-slate-900">
      <PwaRegister />
      <SiteHeader />
      <main>
        <SignatureHero />
        <ProofMarquee />

        <section id="manfaat" className="relative scroll-mt-24 border-y border-[var(--paper-line)] bg-[var(--paper)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="texture-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <SectionHeading eyebrow="Satu kebiasaan, tiga manfaat" title="Bukan sekadar mencatat pengeluaran." description="EcoSpend mengubah catatan harian menjadi konteks yang membantu Anda mengambil keputusan dengan lebih percaya diri." align="center" />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {benefits.map((benefit, index) => (
                <Reveal key={benefit.title} delay={index * 110}>
                <article className="group relative h-full overflow-hidden rounded-[1.6rem] eco-paper p-6 transition duration-300 hover:-translate-y-1.5 hover:border-emerald-700/25 hover:shadow-[0_28px_50px_-28px_rgb(2_44_34/0.35)] motion-reduce:transform-none motion-reduce:transition-none">
                  <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-emerald-200/40 blur-2xl transition group-hover:bg-lime-200/60" aria-hidden="true" />
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-[#0e3b2c] text-[#d8ef87] shadow-lg shadow-[#082419]/30 transition group-hover:scale-105 motion-reduce:transition-none"><benefit.icon className="size-5" aria-hidden="true" /></span>
                    <span className="font-mono text-xs font-ledger text-[#1e6f4e]">0{index + 1}</span>
                  </div>
                  <h3 className="relative mt-6 text-xl font-bold tracking-tight text-[#0e3b2c] dark:text-[#eef5ef]">{benefit.title}</h3>
                  <p className="relative mt-3 text-sm leading-6 text-[#43544b] dark:text-[#c4d2c9]">{benefit.text}</p>
                </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="fitur" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl space-y-24 lg:space-y-32">
            <FeatureBlock
              eyebrow="Keuangan"
              title="Semua angka penting, tanpa terasa rumit."
              description="Lihat pemasukan, pengeluaran, dan saldo dalam ringkasan yang bersih. Kategori membantu Anda menemukan kebiasaan kecil yang memberi dampak besar."
              bullets={['Ringkasan arus kas yang mudah dipindai', 'Kategori untuk memahami pola belanja', 'Riwayat transaksi tersusun rapi']}
              visual={<FinanceVisual />}
            />
            <FeatureBlock
              eyebrow="Anggaran"
              title="Rencana yang mengikuti hidup Anda."
              description="Atur batas per kategori, lihat sisa ruang belanja, dan dapatkan konteks lebih awal—bukan rasa bersalah di akhir bulan."
              bullets={['Anggaran fleksibel per kategori', 'Progres dan ambang pengingat yang jelas', 'Tujuan finansial untuk langkah berikutnya']}
              visual={<BudgetVisual />}
              reverse
            />
            <FeatureBlock
              eyebrow="Karbon"
              title="Dampak lingkungan, dibuat lebih terlihat."
              description="EcoSpend menghubungkan aktivitas atau kategori belanja dengan faktor emisi yang relevan untuk menghasilkan estimasi CO₂e yang dapat ditelusuri."
              bullets={['Pendekatan aktivitas atau nilai belanja', 'Sumber dan versi faktor disimpan', 'Tingkat keyakinan dan batasan dijelaskan']}
              visual={<CarbonVisual />}
            />
          </div>
        </section>
        <section id="cara-kerja" className="texture-flow relative scroll-mt-24 overflow-hidden bg-[#082419] px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
          <div className="animate-drift pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:26px_26px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">Cara kerja</p>
                <h2 className="font-display mt-4 text-balance text-3xl font-bold sm:text-5xl">Tiga langkah menuju gambaran yang lebih utuh.</h2>
                <p className="mt-5 max-w-lg leading-7 text-emerald-100/70">Mulai dari catatan sederhana. EcoSpend membantu menyusunnya menjadi insight, tanpa istilah yang membuat pusing.</p>
              </div>
              <ol className="space-y-2">
                {steps.map((step) => (
                  <li key={step.number} className="group grid grid-cols-[auto_1fr] gap-5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 backdrop-blur transition hover:border-lime-300/30 hover:bg-white/[0.06] motion-reduce:transition-none">
                    <span className="grid size-10 place-items-center rounded-xl bg-lime-300/15 font-mono text-sm font-bold text-lime-300">{step.number}</span>
                    <div><h3 className="text-xl font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-emerald-100/65">{step.text}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="transparansi" className="scroll-mt-24 bg-[var(--paper)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28" aria-labelledby="transparency-title">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#edf4e8] p-6 sm:p-10">
              <div className="absolute -right-14 -top-14 size-44 rounded-full border-[28px] border-lime-300/30" aria-hidden="true" />
              <div className="relative rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-xl shadow-emerald-950/10">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><Scale className="size-5" aria-hidden="true" /></span><div><p className="text-xs text-slate-600">Rincian estimasi</p><p className="font-bold text-emerald-950">Perjalanan bus kota</p></div></div>
                <dl className="mt-5 space-y-4 text-sm">
                  <DetailRow label="Metode" value="Berbasis aktivitas" />
                  <DetailRow label="Aktivitas" value="12 km" />
                  <DetailRow label="Faktor" value="kg CO₂e / km" />
                  <DetailRow label="Wilayah" value="Indonesia" />
                  <DetailRow label="Tingkat keyakinan" value="Sedang" />
                </dl>
                <div className="mt-5 rounded-xl bg-emerald-950 p-4 text-white"><p className="text-xs text-emerald-100/60">Hasil indikatif</p><p className="mt-1 text-2xl font-bold">0,31 kg CO₂e*</p></div>
              </div>
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Transparansi metodologi</p>
              <h2 id="transparency-title" className="font-display text-balance text-3xl font-bold text-[#0e3b2c] dark:text-[#eef5ef] sm:text-5xl">Angka yang bisa ditelusuri, batasan yang tidak disembunyikan.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">Setiap estimasi dirancang untuk menyertakan metode, faktor, satuan, sumber, wilayah, dan versi. Anda berhak tahu dari mana sebuah angka berasal.</p>
              <Link href="/methodology" className="mt-7 inline-flex items-center gap-2 font-semibold text-emerald-800 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                Pelajari metodologi <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
              <div className="mt-8 rounded-2xl border border-amber-900/15 bg-amber-50 p-5 text-sm leading-6 text-amber-950/80">
                <strong className="font-semibold text-amber-950">Penting:</strong> estimasi karbon bersifat indikatif dan sangat dipengaruhi kategori serta kualitas faktor. Bukan pengukuran langsung, audit, sertifikasi, dasar pelaporan regulasi, atau klaim lingkungan.
              </div>
            </div>
          </div>
        </section>

        <section id="keamanan" className="scroll-mt-24 border-y border-emerald-950/10 bg-[#f4f7f1] px-5 py-20 sm:px-8 lg:px-10 lg:py-28" aria-labelledby="security-title">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Keamanan & privasi</p>
                <h2 id="security-title" className="font-display mt-4 text-balance text-3xl font-bold text-[#0e3b2c] dark:text-[#eef5ef] sm:text-5xl">Data Anda bukan komoditas.</h2>
                <p className="mt-5 leading-7 text-slate-600">EcoSpend dirancang dengan minimisasi data dan batas akses sebagai prinsip, bukan tambahan di akhir.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SecurityCard icon={Fingerprint} title="Data milik Anda" text="Akses data nyata harus dibatasi ke identitas akun melalui kebijakan database." />
                <SecurityCard icon={LockKeyhole} title="Rahasia tetap di server" text="Kunci administratif tidak pernah menjadi bagian dari konfigurasi browser." />
                <SecurityCard icon={ShieldCheck} title="Mode demo aman" text="Tanpa konfigurasi backend, data yang tampil bersifat sintetis dan tidak persisten." />
                <SecurityCard icon={ReceiptText} title="Jelas sejak awal" text="Tujuan pemrosesan, keterbatasan, serta hak pengguna dijelaskan secara terbuka." />
              </div>
            </div>
          </div>
        </section>
        <LandingCta />
      </main>
      <SiteFooter />
    </div>
  );
}

type FeatureBlockProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: readonly string[];
  visual: React.ReactNode;
  reverse?: boolean;
};

function FeatureBlock({ eyebrow, title, description, bullets, visual, reverse }: FeatureBlockProps) {
  return (
    <article className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <Reveal className={reverse ? "lg:order-2" : ""}>
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-[#1e6f4e]/25 bg-[#1e6f4e]/[.07] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#1e6f4e]">{eyebrow}</p>
        <h2 className="font-display mt-4 text-balance text-3xl font-bold text-[#0e3b2c] dark:text-[#eef5ef] sm:text-5xl">{title}</h2>
        <p className="mt-5 text-lg leading-8 text-[#43544b] dark:text-[#c4d2c9]">{description}</p>
        <ul className="mt-7 space-y-3">
          {bullets.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#33423a] dark:text-[#d4ded8]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-700 text-white shadow-sm"><Check className="size-3" aria-hidden="true" /></span>{item}</li>)}
        </ul>
      </div>
      </Reveal>
      <Reveal delay={120} className={reverse ? "lg:order-1" : ""}>{visual}</Reveal>
    </article>
  );
}

function FinanceVisual() {
  return (
    <div className="eco-paper relative overflow-hidden rounded-[1.7rem] p-5 sm:p-8">
      <div className="texture-flow pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="eco-ledger-row relative flex items-start justify-between gap-4 pb-5"><div><p className="font-ledger text-[11px] uppercase tracking-[0.2em] text-[#1e6f4e]">Halaman 01 · Keuangan</p><p className="font-display mt-2 text-3xl font-extrabold text-[#0e3b2c]">Rp12.460.000</p><p className="mt-1 text-xs text-[#43544b]">Saldo bersih jurnal bulan ini</p></div><span className="grid size-11 place-items-center rounded-full bg-[#0e3b2c] text-[#d8ef87]"><WalletCards className="size-5" aria-hidden="true" /></span></div>
      <div className="relative mt-5 grid grid-cols-2 gap-3"><MiniStat icon={ArrowRight} label="Uang masuk" value="Rp8,5 jt" green /><MiniStat icon={ArrowRight} label="Uang keluar" value="Rp4,2 jt" /></div>
      <div className="relative mt-6"><div className="flex items-end justify-between"><p className="text-sm font-bold text-[#0e3b2c]">Alur delapan pekan</p><p className="font-ledger text-xs text-[#1e6f4e]">+14% bulan ini</p></div><div className="mt-5 flex h-28 items-end gap-2">{[30,55,42,72,48,84,68,92].map((height, i) => <span key={i} className="flex-1 rounded-t-full bg-[#1e6f4e]/15" style={{ height: `${height}%` }}><span className="block w-full rounded-t-full bg-gradient-to-t from-[#1e6f4e] to-[#57c87a]" style={{ height: `${Math.max(20, height - 22)}%` }} /></span>)}</div></div>
    </div>
  );
}

function BudgetVisual() {
  const items = [{ label: 'Makan & minum', spent: 'Rp1,2 jt', width: '72%' }, { label: 'Transportasi', spent: 'Rp640 rb', width: '48%' }, { label: 'Belanja rumah', spent: 'Rp890 rb', width: '63%' }];
  return <div className="eco-paper relative overflow-hidden rounded-[1.7rem] bg-[#f3eee3] p-5 sm:p-8"><div className="relative rounded-2xl border border-[#0e3b2c]/10 bg-white p-5 shadow-xl shadow-[#082419]/10"><div className="flex items-center justify-between"><div><p className="font-ledger text-[11px] uppercase tracking-[0.2em] text-[#1e6f4e]">Rencana belanja</p><p className="font-display mt-1 text-xl font-extrabold text-[#0e3b2c]">Rp4,7 jt tersisa</p></div><span className="grid size-11 place-items-center rounded-full bg-[#d99a2b] text-white"><PiggyBank className="size-5" aria-hidden="true" /></span></div><div className="mt-7 space-y-5">{items.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#33423a]">{item.label}</span><span className="font-ledger text-[#2e3d35]">{item.spent}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#0e3b2c]/10"><div className="h-full rounded-full bg-gradient-to-r from-[#1e6f4e] to-[#57c87a]" style={{ width: item.width }} /></div></div>)}</div><div className="mt-7 flex items-center gap-3 rounded-xl bg-[#1e6f4e]/[.07] p-4"><Gauge className="size-5 text-[#1e6f4e]" aria-hidden="true" /><p className="text-xs leading-5 text-[#0e3b2c]"><strong>Masih sesuai rencana.</strong><br />Anda telah memakai 58% anggaran bulan ini.</p></div></div></div>;
}

function CarbonVisual() {
  return <div className="relative overflow-hidden rounded-[1.7rem] bg-[#082419] p-5 text-white sm:p-8"><div className="texture-flow pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" /><div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"><div className="flex items-center justify-between"><div><p className="font-ledger text-[11px] uppercase tracking-[0.2em] text-[#d8ef87]">Catatan dampak</p><p className="font-display mt-1 text-3xl font-extrabold">86,4 kg CO₂e*</p></div><span className="grid size-11 place-items-center rounded-full bg-[#d8ef87] text-[#082419]"><Leaf className="size-5" aria-hidden="true" /></span></div><div className="mt-7 grid grid-cols-[auto_1fr] items-center gap-6"><div className="grid size-28 place-items-center rounded-full border-[12px] border-white/10 border-t-[#d8ef87]"><span className="font-ledger text-lg font-bold">−12%</span></div><div className="space-y-3"><Legend color="bg-[#d8ef87]" label="Transportasi" value="34%" /><Legend color="bg-[#57c87a]" label="Makanan" value="28%" /><Legend color="bg-[#e3bb68]" label="Belanja" value="21%" /><Legend color="bg-white/40" label="Lainnya" value="17%" /></div></div><div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-white/70"><LineChart className="size-4 text-[#d8ef87]" aria-hidden="true" />Estimasi turun dibanding periode sebelumnya.</div></div></div>;
}

function MiniStat({ icon: Icon, label, value, green }: { icon: typeof ArrowRight; label: string; value: string; green?: boolean }) { return <div className="rounded-xl bg-slate-50 p-3"><span className={`grid size-7 place-items-center rounded-lg ${green ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}><Icon className={`size-3.5 ${green ? '-rotate-45' : 'rotate-45'}`} aria-hidden="true" /></span><p className="mt-3 text-[10px] text-slate-600">{label}</p><p className="text-sm font-bold text-slate-900">{value}</p></div>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs"><span className={`size-2 rounded-full ${color}`} /><span className="text-emerald-100/70">{label}</span><span className="font-semibold">{value}</span></div>; }
function DetailRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>; }
function SecurityCard({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) { return <article className="group rounded-[1.4rem] border border-emerald-950/10 bg-white p-5 shadow-[0_16px_32px_-26px_rgb(2_44_34/0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_44px_-26px_rgb(2_44_34/0.45)] motion-reduce:transform-none motion-reduce:transition-none"><span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-md shadow-emerald-900/20 transition group-hover:scale-105 motion-reduce:transition-none"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 font-bold text-emerald-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>; }
