import Link from "next/link";
import { ArrowLeft, CheckCircle2, Leaf } from "lucide-react";
import { Brand } from "./brand";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-[#f7f9f4] lg:grid-cols-[0.85fr_1.15fr]">
      <section className="relative hidden overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16" aria-label="Tentang EcoSpend">
        <div className="absolute -right-20 -top-20 size-80 rounded-full border-[56px] border-emerald-800/50" aria-hidden="true" />
        <Link href="/" className="relative inline-flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-emerald-950"><Leaf className="size-5" aria-hidden="true" /></span>
          EcoSpend
        </Link>
        <div className="relative max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">Keputusan yang lebih sadar</p>
          <h2 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-[-0.04em] xl:text-5xl">Keuangan jernih. Dampak lebih terlihat.</h2>
          <ul className="mt-8 space-y-4 text-sm text-emerald-100/75">
            {['Pahami arus uang dalam satu tampilan', 'Susun anggaran yang realistis', 'Lihat estimasi CO₂e secara transparan'].map((item) => (
              <li key={item} className="flex items-center gap-3"><CheckCircle2 className="size-5 text-lime-300" aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </div>
        <p className="relative max-w-md text-xs leading-5 text-emerald-100/50">Estimasi karbon bersifat indikatif dan bukan audit, pengukuran langsung, atau sertifikasi lingkungan.</p>
      </section>
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Brand />
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 lg:hidden"><ArrowLeft className="size-4" aria-hidden="true" />Beranda</Link>
        </div>
        <div className="my-auto w-full max-w-md self-center py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-emerald-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
