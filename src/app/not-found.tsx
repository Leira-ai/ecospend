import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-5 py-16 text-center">
      <div className="max-w-md rounded-[1.8rem] border border-[var(--paper-line)] bg-[var(--paper)] p-8 shadow-xl">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <Compass className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#1e6f4e] dark:text-[#8bd3a7]">
          Galat 404
        </p>
        <h1 className="font-display mt-2 text-3xl font-extrabold text-[#0e3b2c] dark:text-[#eef5ef]">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#43544b] dark:text-[#b8c7bd]">
          Tautan yang Anda tuju mungkin sudah dipindahkan atau alamatnya salah ketik.
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#082419] px-6 text-sm font-semibold text-white transition hover:bg-[#0e3b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] dark:bg-[#1e6f4e] dark:hover:bg-[#2fa36b]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
