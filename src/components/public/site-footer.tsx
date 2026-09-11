import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LeafCoin } from "@/components/brand/leaf-coin";

const linkGroups = [
  {
    title: "Produk",
    links: [
      { label: "Manfaat", href: "/#manfaat" },
      { label: "Cara kerja", href: "/#cara-kerja" },
      { label: "Metodologi", href: "/methodology" },
    ],
  },
  {
    title: "Akun",
    links: [
      { label: "Masuk", href: "/login" },
      { label: "Daftar", href: "/register" },
      { label: "Lupa kata sandi", href: "/forgot-password" },
    ],
  },
  {
    title: "Ketentuan",
    links: [
      { label: "Privasi", href: "/privacy" },
      { label: "Syarat penggunaan", href: "/terms" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--paper-line)] bg-[#f1f5ed] text-[#0e3b2c] dark:bg-[#08130e] dark:text-[#b8c7bd]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.5fr_2fr] lg:px-10 lg:py-16">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
            <LeafCoin className="size-9" />
            EcoSpend
          </Link>
          <p className="mt-5 text-sm leading-6 text-[#2d4338] dark:text-[#b8c7bd]">
            Catat keuangan dengan lebih jernih, lalu pahami perkiraan dampak karbon di balik kebiasaan belanja Anda.
          </p>
          <p className="text-xs text-[#2d4338] dark:text-[#b8c7bd]">Butuh bantuan? <a className="font-semibold underline underline-offset-4 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:hover:text-[#8bd3a7]" href="mailto:support@ecospend.local">support@ecospend.local</a></p>
          <p className="mt-3 rounded-xl border border-amber-900/15 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950/80 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200/90">
            Angka karbon adalah estimasi indikatif, bukan pengukuran langsung, audit, sertifikasi, atau nasihat finansial.
          </p>
        </div>
        <nav aria-label="Tautan footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-[#0e3b2c] dark:text-[#eef5ef]">{group.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-[#1b4332] dark:text-[#b8c7bd]">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link className="inline-flex items-center gap-1 rounded-md underline-offset-4 hover:text-[#1e6f4e] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:hover:text-[#8bd3a7]" href={link.href}>
                      {link.label}
                      {link.href.startsWith("/#") && <ArrowUpRight className="size-3" aria-hidden="true" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-[var(--paper-line)] px-5 py-5 text-center text-xs text-[#2d4338] dark:text-[#a0b0a6] sm:px-8">
        <p>© 2026 EcoSpend. Dibuat untuk keputusan sehari-hari yang lebih sadar.</p>
      </div>
    </footer>
  );
}
