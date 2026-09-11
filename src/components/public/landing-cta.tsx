import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function LandingCta() {
  return (
    <section className="bg-[var(--background)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28" aria-labelledby="cta-title">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#082419] px-6 py-12 text-white shadow-2xl shadow-emerald-950/15 sm:px-10 lg:px-16 lg:py-16">
        <div className="absolute -right-16 -top-28 size-72 rounded-full border-[48px] border-emerald-400/10" aria-hidden="true" />
        <div className="relative grid items-end gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-300">Mulai dari hal kecil</p>
            <h2 id="cta-title" className="mt-4 max-w-3xl text-balance text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
              Jadikan setiap rupiah lebih bermakna.
            </h2>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-emerald-100/80">
              {['Tanpa kartu kredit', 'Data demo sintetis', 'Bisa dipasang sebagai PWA'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-lime-300" aria-hidden="true" />{item}
                </span>
              ))}
            </div>
          </div>
          <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3 font-semibold text-[#082419] shadow-lg shadow-black/10 transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none">
            Buat akun gratis <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
