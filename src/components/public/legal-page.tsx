import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import { Brand } from "./brand";
import { SiteFooter } from "./site-footer";

type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: readonly LegalSection[];
};

export function LegalPage({ eyebrow, title, intro, updated, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#f7f9f4] text-slate-900">
      <header className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"><Brand /><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"><ArrowLeft className="size-4" aria-hidden="true" />Beranda</Link></div>
      </header>
      <main>
        <section className="border-b border-emerald-950/10 bg-emerald-950 px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">{eyebrow}</p><h1 className="mt-4 text-balance text-4xl font-bold tracking-[-0.045em] sm:text-6xl">{title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-emerald-100/75">{intro}</p><p className="mt-6 text-xs text-emerald-100/50">Diperbarui: {updated}</p></div>
        </section>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[240px_1fr] lg:px-10 lg:py-20">
          <aside className="lg:sticky lg:top-8 lg:self-start"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Di halaman ini</p><nav className="mt-4" aria-label="Daftar isi"><ol className="space-y-2 border-l border-emerald-950/10">{sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="block border-l-2 border-transparent py-1.5 pl-4 text-sm text-slate-600 hover:border-emerald-700 hover:text-emerald-800">{section.title}</a></li>)}</ol></nav></aside>
          <article className="min-w-0 max-w-3xl rounded-2xl border border-emerald-950/10 bg-white px-6 py-2 shadow-sm sm:px-10">
            {sections.map((section) => <section id={section.id} key={section.id} className="scroll-mt-8 border-b border-slate-100 py-8 last:border-0"><h2 className="text-2xl font-bold tracking-tight text-emerald-950">{section.title}</h2><div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 [&_a]:font-semibold [&_a]:text-emerald-700 [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-slate-800">{section.content}</div></section>)}
          </article>
        </div>
        <section className="px-5 pb-16 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl bg-emerald-100 p-5 text-sm leading-6 text-emerald-950"><Leaf className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p>Punya pertanyaan tentang dokumen ini? Sebelum kanal privasi resmi tersedia, jangan kirim data transaksi, kata sandi, token, atau informasi sensitif melalui issue publik.</p></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
