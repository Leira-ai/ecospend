"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { buttonPrimary } from "@/components/dashboard/ui";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("Dashboard error", error.digest); }, [error.digest]);
  return <div className="grid min-h-[60vh] place-items-center"><div className="max-w-md text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950"><AlertTriangle className="size-7" /></span><h1 className="mt-5 text-2xl font-bold">Dasbor tidak dapat dimuat</h1><p className="mt-2 text-sm leading-6 text-slate-600">Terjadi kendala sementara. Data pribadi tidak ditampilkan dalam pesan kesalahan ini.</p><button type="button" onClick={retry} className={`${buttonPrimary} mt-5`}><RefreshCw className="size-4" />Coba lagi</button></div></div>;
}
