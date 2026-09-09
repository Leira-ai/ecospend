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
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import { DashboardPreview } from "@/components/public/dashboard-preview";
import { LandingCta } from "@/components/public/landing-cta";
import { PwaRegister } from "@/components/public/pwa-register";
import { SectionHeading } from "@/components/public/section-heading";
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
        <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="absolute left-[8%] top-20 -z-0 size-64 rounded-full bg-lime-200/30 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Keuangan sehat, bumi lebih terjaga
              </div>
              <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.04] tracking-[-0.055em] text-emerald-950 sm:text-6xl lg:text-7xl">
                Pahami uangmu. <span className="text-emerald-700">Kenali dampaknya.</span>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-slate-600">
                EcoSpend membantu Anda mencatat keuangan, menjaga anggaran, dan melihat perkiraan jejak karbon dari pengeluaran—dalam satu tempat yang tenang dan mudah dipahami.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none">
                  Mulai kelola sekarang <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="#cara-kerja" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-900/15 bg-white px-5 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 motion-reduce:transition-none">
                  Lihat cara kerja
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                {['Gratis untuk memulai', 'Tanpa iklan', 'Privasi sebagai dasar'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-700" aria-hidden="true" />{item}</span>
                ))}
              </div>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section id="manfaat" className="scroll-mt-24 border-y border-emerald-950/10 bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Satu kebiasaan, tiga manfaat" title="Bukan sekadar mencatat pengeluaran." description="EcoSpend mengubah catatan harian menjadi konteks yang membantu Anda mengambil keputusan dengan lebih percaya diri." align="center" />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {benefits.map((benefit, index) => (
                <article key={benefit.title} className="group rounded-2xl border border-emerald-950/10 bg-[#fbfcf9] p-6 transition hover:-translate-y-1 hover:border-emerald-700/25 hover:shadow-xl hover:shadow-emerald-950/5 motion-reduce:transform-none motion-reduce:transition-none">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><benefit.icon className="size-5" aria-hidden="true" /></span>
                    <span className="font-mono text-xs text-emerald-950/65">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-emerald-950">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{benefit.text}</p>
                </article>
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
        <section id="cara-kerja" className="scroll-mt-24 bg-emerald-950 px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">Cara kerja</p>
                <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Tiga langkah menuju gambaran yang lebih utuh.</h2>
                <p className="mt-5 max-w-lg leading-7 text-emerald-100/70">Mulai dari catatan sederhana. EcoSpend membantu menyusunnya menjadi insight, tanpa istilah yang membuat pusing.</p>
              </div>
              <ol className="space-y-2">
                {steps.map((step) => (
                  <li key={step.number} className="grid grid-cols-[auto_1fr] gap-5 border-b border-white/10 py-6 first:pt-0 last:border-0">
                    <span className="font-mono text-sm text-lime-300">{step.number}</span>
                    <div><h3 className="text-xl font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-emerald-100/65">{step.text}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28" aria-labelledby="transparency-title">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#edf4e8] p-6 sm:p-10">
              <div className="absolute -right-14 -top-14 size-44 rounded-full border-[28px] border-lime-300/30" aria-hidden="true" />
              <div className="relative rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-xl shadow-emerald-950/10">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><Scale className="size-5" aria-hidden="true" /></span><div><p className="text-xs text-slate-500">Rincian estimasi</p><p className="font-bold text-emerald-950">Perjalanan bus kota</p></div></div>
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
              <h2 id="transparency-title" className="text-balance text-3xl font-bold tracking-[-0.04em] text-emerald-950 sm:text-5xl">Angka yang bisa ditelusuri, batasan yang tidak disembunyikan.</h2>
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

        <section className="border-y border-emerald-950/10 bg-[#f4f7f1] px-5 py-20 sm:px-8 lg:px-10 lg:py-28" aria-labelledby="security-title">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Keamanan & privasi</p>
                <h2 id="security-title" className="mt-4 text-balance text-3xl font-bold tracking-[-0.04em] text-emerald-950 sm:text-5xl">Data Anda bukan komoditas.</h2>
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
      <div className={reverse ? "lg:order-2" : ""}>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
        <h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.04em] text-emerald-950 sm:text-5xl">{title}</h2>
        <p className="mt-5 text-lg leading-8 text-slate-600">{description}</p>
        <ul className="mt-7 space-y-3">
          {bullets.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800"><Check className="size-3" aria-hidden="true" /></span>{item}</li>)}
        </ul>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
    </article>
  );
}

function FinanceVisual() {
  return (
    <div className="rounded-[2rem] bg-[#eaf3e4] p-5 sm:p-8">
      <div className="rounded-2xl bg-white p-5 shadow-xl shadow-emerald-950/10">
        <div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">Saldo bersih</p><p className="mt-1 text-2xl font-bold text-emerald-950">Rp12.460.000</p></div><span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><WalletCards className="size-5" aria-hidden="true" /></span></div>
        <div className="mt-7 grid grid-cols-2 gap-3"><MiniStat icon={ArrowRight} label="Pemasukan" value="Rp8,5 jt" green /><MiniStat icon={ArrowRight} label="Pengeluaran" value="Rp4,2 jt" /></div>
        <div className="mt-6"><div className="flex items-end justify-between"><p className="text-sm font-semibold text-slate-800">Arus kas</p><p className="text-xs text-emerald-700">+14% bulan ini</p></div><div className="mt-5 flex h-28 items-end gap-2">{[30,55,42,72,48,84,68,92].map((height, i) => <span key={i} className="flex-1 rounded-t-md bg-emerald-700/15" style={{ height: `${height}%` }}><span className="block w-full rounded-t-md bg-emerald-700" style={{ height: `${Math.max(20, height - 22)}%` }} /></span>)}</div></div>
      </div>
    </div>
  );
}

function BudgetVisual() {
  const items = [{ label: 'Makan & minum', spent: 'Rp1,2 jt', width: '72%' }, { label: 'Transportasi', spent: 'Rp640 rb', width: '48%' }, { label: 'Belanja rumah', spent: 'Rp890 rb', width: '63%' }];
  return <div className="rounded-[2rem] bg-[#f3eee3] p-5 sm:p-8"><div className="rounded-2xl bg-white p-5 shadow-xl shadow-emerald-950/10"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">Anggaran September</p><p className="mt-1 text-xl font-bold text-emerald-950">Rp4,7 jt tersisa</p></div><span className="grid size-11 place-items-center rounded-xl bg-orange-100 text-orange-800"><PiggyBank className="size-5" aria-hidden="true" /></span></div><div className="mt-7 space-y-5">{items.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-700">{item.label}</span><span className="text-slate-500">{item.spent}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: item.width }} /></div></div>)}</div><div className="mt-7 flex items-center gap-3 rounded-xl bg-emerald-50 p-4"><Gauge className="size-5 text-emerald-700" aria-hidden="true" /><p className="text-xs leading-5 text-emerald-950"><strong>Masih sesuai rencana.</strong><br />Anda telah memakai 58% anggaran bulan ini.</p></div></div></div>;
}

function CarbonVisual() {
  return <div className="rounded-[2rem] bg-emerald-900 p-5 text-white sm:p-8"><div className="rounded-2xl border border-white/10 bg-emerald-950/60 p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-emerald-100/60">Perkiraan bulan ini</p><p className="mt-1 text-3xl font-bold">86,4 kg CO₂e*</p></div><span className="grid size-11 place-items-center rounded-xl bg-lime-300 text-emerald-950"><Leaf className="size-5" aria-hidden="true" /></span></div><div className="mt-7 grid grid-cols-[auto_1fr] items-center gap-6"><div className="grid size-28 place-items-center rounded-full border-[12px] border-emerald-700 border-t-lime-300"><span className="text-lg font-bold">−12%</span></div><div className="space-y-3"><Legend color="bg-lime-300" label="Transportasi" value="34%" /><Legend color="bg-emerald-400" label="Makanan" value="28%" /><Legend color="bg-orange-300" label="Belanja" value="21%" /><Legend color="bg-slate-400" label="Lainnya" value="17%" /></div></div><div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-emerald-100/70"><LineChart className="size-4 text-lime-300" aria-hidden="true" />Estimasi turun dibanding periode sebelumnya.</div></div></div>;
}

function MiniStat({ icon: Icon, label, value, green }: { icon: typeof ArrowRight; label: string; value: string; green?: boolean }) { return <div className="rounded-xl bg-slate-50 p-3"><span className={`grid size-7 place-items-center rounded-lg ${green ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}><Icon className={`size-3.5 ${green ? '-rotate-45' : 'rotate-45'}`} aria-hidden="true" /></span><p className="mt-3 text-[10px] text-slate-500">{label}</p><p className="text-sm font-bold text-slate-900">{value}</p></div>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs"><span className={`size-2 rounded-full ${color}`} /><span className="text-emerald-100/70">{label}</span><span className="font-semibold">{value}</span></div>; }
function DetailRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>; }
function SecurityCard({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) { return <article className="rounded-2xl border border-emerald-950/10 bg-white p-5"><span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 font-bold text-emerald-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>; }
