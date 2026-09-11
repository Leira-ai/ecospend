"use client";

import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors safely without exposing user private state
    console.error("Global application error:", error.digest || error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-5 py-16 text-center">
      <div className="max-w-md rounded-[1.6rem] border border-[var(--paper-line)] bg-[var(--paper)] p-8 shadow-xl">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          <AlertCircle className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#0e3b2c] dark:text-[#eef5ef]">
          Terjadi kendala sementara
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#43544b] dark:text-[#b8c7bd]">
          Aplikasi mengalami masalah teknis saat memuat halaman ini. Data Anda tetap aman.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#082419] px-5 text-sm font-semibold text-white transition hover:bg-[#0e3b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] dark:bg-[#1e6f4e] dark:hover:bg-[#2fa36b]"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Muat ulang
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--paper-line)] bg-white px-5 text-sm font-semibold text-[#0e3b2c] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f4e] dark:bg-[#0c1a13] dark:text-[#eef5ef] dark:hover:bg-white/10"
          >
            <Home className="size-4" aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
