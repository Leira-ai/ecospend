"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";

const navigation = [
  { label: "Manfaat", href: "#manfaat" },
  { label: "Fitur", href: "#fitur" },
  { label: "Cara kerja", href: "#cara-kerja" },
  { label: "Metodologi", href: "/methodology" },
  { label: "Harga", href: "/pricing" },
  { label: "Kalkulator CO₂e", href: "/kalkulator-emisi" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--paper-line)] bg-[var(--background)]/90 shadow-[0_10px_30px_-22px_rgb(12_43_35/0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--background)]/75">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10" aria-label="Navigasi utama">
        <Brand />
        <div className="hidden items-center gap-1.5 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} className="group relative rounded-full px-4 py-2 text-sm font-semibold text-[#43544b] transition hover:bg-black/5 hover:text-[#0e3b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] motion-reduce:transition-none dark:text-[#b8c7bd] dark:hover:bg-white/10 dark:hover:text-[#eef5ef]" href={item.href}>
              {item.label}
              <span className="absolute inset-x-4 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-[#1e6f4e] transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none dark:bg-[#8bd3a7]" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0e3b2c] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] dark:text-[#eef5ef] dark:hover:bg-white/10">
            Masuk
          </Link>
          <Link href="/register" className="rounded-xl bg-[#082419] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgb(4_120_87/0.9)] transition hover:-translate-y-px hover:bg-[#0e3b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:bg-[#1e6f4e] dark:hover:bg-[#2fa36b]">
            Mulai gratis
          </Link>
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-[var(--paper-line)] text-[#0e3b2c] dark:text-[#eef5ef] sm:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </nav>
      {open && (
        <nav id="mobile-navigation" aria-label="Navigasi seluler" className="border-t border-[var(--paper-line)] bg-[var(--paper)] px-5 py-5 sm:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium text-[#43544b] hover:bg-black/5 dark:text-[#c4d2c9] dark:hover:bg-white/10">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--paper-line)] pt-4">
              <Link href="/login" className="rounded-xl border border-[var(--paper-line)] px-4 py-3 text-center text-sm font-semibold text-[#0e3b2c] dark:text-[#eef5ef]">Masuk</Link>
              <Link href="/register" className="rounded-xl bg-[#082419] px-4 py-3 text-center text-sm font-semibold text-white dark:bg-[#1e6f4e]">Mulai gratis</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
