"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import {
  Bell, ChevronRight, CircleDollarSign, FileChartColumn, FileUp,
  Goal, LayoutDashboard, Leaf, Menu, ReceiptText, Settings, X,
} from "lucide-react";
import { LeafCoin } from "@/components/brand/leaf-coin";
import { DemoProvider } from "./demo-store";
import { AuthenticatedStoreProvider, dashboardHref, useDashboardStore } from "./store-context";
import { ThemeControl } from "./theme-control";

const navigation = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/dashboard/transaksi", label: "Transaksi", icon: ReceiptText },
  { href: "/dashboard/impor", label: "Impor data", icon: FileUp },
  { href: "/dashboard/anggaran", label: "Anggaran", icon: CircleDollarSign },
  { href: "/dashboard/target", label: "Target", icon: Goal },
  { href: "/dashboard/karbon", label: "Jejak karbon", icon: Leaf },
  { href: "/dashboard/laporan", label: "Laporan", icon: FileChartColumn },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings },
];

function Brand({ isDemo }: { isDemo: boolean }) {
  return <Link href={dashboardHref("/dashboard", isDemo)} className="group flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8ef87]"><LeafCoin className="size-11 transition duration-300 group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transition-none" /><span><span className="font-display block text-lg font-extrabold text-white">EcoSpend</span><span className="block text-[11px] font-medium text-[#cce0d2]">Jurnal keuangan hidup</span></span></Link>;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname(); const { preferences, isDemo } = useDashboardStore();
  const initials = preferences.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "ES";
  return <div className="relative flex h-full flex-col overflow-hidden bg-[#0b352b] text-white"><div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" /><div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-lime-300/10 blur-3xl" aria-hidden="true" /><div className="relative px-5 py-5"><Brand isDemo={isDemo} /></div>
    <div className="relative mx-4 mb-4 flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-emerald-100 shadow-inner backdrop-blur"><span className="relative flex size-2 shrink-0" aria-hidden="true"><span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-300 opacity-70 motion-reduce:animate-none" /><span className="relative inline-flex size-2 rounded-full bg-lime-300" /></span><span>{isDemo ? "Mode demo · tersimpan lokal" : "Akun terautentikasi · tersimpan aman"}</span></div>
    <nav aria-label="Navigasi utama" className="relative flex-1 overflow-y-auto px-3"><ul className="space-y-1">{navigation.map(({ href, label, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); return <li key={href}><Link href={dashboardHref(href, isDemo)} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 motion-reduce:transition-none ${active ? "bg-white text-emerald-900 shadow-[0_14px_28px_-16px_rgb(0_0_0/0.6)]" : "text-emerald-50/75 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"}`}><span className={`grid size-8 place-items-center rounded-lg transition ${active ? "bg-emerald-700 text-white" : "bg-white/10 text-emerald-100 group-hover:bg-white/20"}`}><Icon className="size-4" /></span><span>{label}</span>{active && <ChevronRight className="ml-auto size-4" />}</Link></li>; })}</ul></nav>
    <div className="relative border-t border-white/10 bg-white/[0.04] p-4 backdrop-blur"><div className="flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lime-200 to-emerald-300 text-sm font-extrabold text-emerald-950 shadow">{isDemo ? "PD" : initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{preferences.displayName}</p><p className="text-xs text-emerald-100/60">{isDemo ? "Data tanpa identitas pribadi" : "Profil EcoSpend Anda"}</p></div></div></div>
  </div>;
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markNotificationsRead } = useDashboardStore(); const unreadIds = notifications.filter((item) => item.status === "unread").map((item) => item.id);
  if (!open) return null;
  return <section aria-label="Panel notifikasi" className="absolute right-4 top-14 z-30 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:right-6 lg:right-8"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Notifikasi</h2><p className="text-xs text-slate-600">{unreadIds.length ? `${unreadIds.length} belum dibaca` : "Semua sudah dibaca"}</p></div><button type="button" onClick={onClose} aria-label="Tutup notifikasi" className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4" /></button></div><ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{notifications.map((item) => <li key={item.id} className="py-3"><div className="flex gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.status === "unread" ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"}`} /><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</p></div></div></li>)}</ul>{unreadIds.length > 0 && <button type="button" onClick={() => void markNotificationsRead(unreadIds)} className="mt-3 min-h-10 w-full rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Tandai semua dibaca</button>}</section>;
}

function DataBoundary({ children }: { children: React.ReactNode }) {
  const { loading, error, retry } = useDashboardStore();
  if (loading) return <div role="status" className="grid min-h-[50vh] place-items-center text-sm font-semibold text-slate-600">Memuat data EcoSpend…</div>;
  if (error) return <div role="alert" className="mx-auto mt-12 max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900"><h1 className="font-bold">Data dasbor belum dapat dimuat</h1><p className="mt-2 text-sm">{error}</p><button type="button" onClick={() => void retry()} className="mt-4 min-h-10 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white">Coba lagi</button></div>;
  return children;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false); const [notificationOpen, setNotificationOpen] = useState(false);
  const pathname = usePathname(); const store = useDashboardStore(); const unread = store.notifications.filter((item) => item.status === "unread").length;
  useEffect(() => { const showFallback = () => setNotificationOpen(true); window.addEventListener("ecospend:in-app-notification", showFallback); return () => window.removeEventListener("ecospend:in-app-notification", showFallback); }, []);
  const current = navigation.find((item) => item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href));
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()), []);
  return <div className="min-h-screen bg-[#f2f6f3] text-slate-900 dark:bg-slate-950 dark:text-slate-100"><a href="#konten-utama" className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-lg bg-white px-4 py-2 font-semibold text-emerald-800 shadow focus:translate-y-0">Lewati ke konten utama</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] lg:block"><SidebarContent /></aside>{open && <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-[min(20rem,88vw)] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="relative h-full"><SidebarContent onNavigate={() => setOpen(false)} /><button type="button" onClick={() => setOpen(false)} aria-label="Tutup navigasi" className="absolute right-3 top-4 grid size-11 place-items-center rounded-xl text-white hover:bg-white/10"><X /></button></div></aside></div>}
      <div className="lg:pl-[17rem]"><header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 shadow-[0_12px_28px_-24px_rgb(2_44_34/0.4)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85"><div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8"><button type="button" onClick={() => setOpen(true)} aria-label="Buka navigasi" aria-expanded={open} className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white/70 text-slate-700 shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Menu /></button><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{current?.label ?? "EcoSpend"}</p><p className="hidden text-xs text-slate-600 sm:block dark:text-slate-300">{dateLabel} · {store.isDemo ? "Demo lokal" : "Data akun"}</p></div><ThemeControl compact /><div className="relative"><button type="button" onClick={() => setNotificationOpen((value) => !value)} aria-label={`Notifikasi, ${unread} belum dibaca`} aria-expanded={notificationOpen} aria-controls="notification-panel" className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-px hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 motion-reduce:transform-none motion-reduce:transition-none"><Bell className="size-[18px]" />{unread > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-[10px] font-bold text-white shadow">{unread}</span>}</button></div></div><div id="notification-panel"><NotificationPanel open={notificationOpen} onClose={() => setNotificationOpen(false)} /></div></header><main id="konten-utama" className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-10 lg:p-8">{children && <div key={pathname} className="animate-pop">{children}</div>}</main></div>
    <nav aria-label="Navigasi cepat seluler" className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--paper-line)] bg-[var(--paper)]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden"><div className="grid grid-cols-5">{navigation.filter((_, index) => [0,1,3,5,7].includes(index)).map(({ href, label, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={dashboardHref(href, store.isDemo)} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition ${active ? "bg-[#0e3b2c] text-[#d8ef87]" : "text-[#43544b] hover:bg-black/5 dark:text-[#c4d2c9]"}`}><Icon className="size-4" /><span>{label}</span></Link>; })}</div></nav><Toaster richColors position="top-right" />
  </div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";
  if (isDemo) return <DemoProvider><AppShellInner>{children}</AppShellInner></DemoProvider>;
  return <AuthenticatedStoreProvider><AppShellInner><DataBoundary>{children}</DataBoundary></AppShellInner></AuthenticatedStoreProvider>;
}
