import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonPrimary } from "@/components/dashboard/ui";

export default function DashboardNotFound() {
  return <div className="grid min-h-[60vh] place-items-center"><div className="max-w-md text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950"><Compass className="size-7" /></span><h1 className="mt-5 text-2xl font-bold">Halaman tidak ditemukan</h1><p className="mt-2 text-sm leading-6 text-slate-600">Fitur dasbor yang Anda cari tidak tersedia atau alamatnya telah berubah.</p><Link href="/dashboard?demo=1" className={`${buttonPrimary} mt-5`}>Kembali ke ringkasan</Link></div></div>;
}
