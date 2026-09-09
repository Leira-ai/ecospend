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
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-[#f7f9f4]/95 backdrop-blur-lg supports-[backdrop-filter]:bg-[#f7f9f4]/80">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10" aria-label="Navigasi utama">
        <Brand />
        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} className="text-sm font-medium text-slate-600 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 motion-reduce:transition-none" href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-950/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
            Masuk
          </Link>
          <Link href="/register" className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 motion-reduce:transition-none">
            Mulai gratis
          </Link>
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-emerald-950/10 text-emerald-950 sm:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </nav>
      {open && (
        <nav id="mobile-navigation" aria-label="Navigasi seluler" className="border-t border-emerald-950/10 bg-[#f7f9f4] px-5 py-5 sm:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-emerald-50">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-950/10 pt-4">
              <Link href="/login" className="rounded-xl border border-emerald-900/15 px-4 py-3 text-center text-sm font-semibold text-emerald-950">Masuk</Link>
              <Link href="/register" className="rounded-xl bg-emerald-800 px-4 py-3 text-center text-sm font-semibold text-white">Mulai gratis</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
