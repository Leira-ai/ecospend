"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import {
  Bell, ChevronRight, CircleDollarSign, FileChartColumn, FileUp,
  Goal, LayoutDashboard, Leaf, Menu, ReceiptText, Settings, Sparkles, X,
} from "lucide-react";
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
  return <Link href={dashboardHref("/dashboard", isDemo)} className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"><span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"><Leaf className="size-5" /></span><span><span className="block text-lg font-black tracking-tight text-white">EcoSpend</span><span className="block text-[11px] text-emerald-200">Uang sehat, bumi hemat</span></span></Link>;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname(); const { preferences, isDemo } = useDashboardStore();
  const initials = preferences.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "ES";
  return <div className="flex h-full flex-col bg-[#0d3d33] text-white"><div className="px-5 py-5"><Brand isDemo={isDemo} /></div>
    <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100"><Sparkles className="size-4" /><span>{isDemo ? "Mode demo · tersimpan lokal" : "Akun terautentikasi · tersimpan aman"}</span></div>
    <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3"><ul className="space-y-1">{navigation.map(({ href, label, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); return <li key={href}><Link href={dashboardHref(href, isDemo)} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${active ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"}`}><Icon className="size-[18px]" /><span>{label}</span>{active && <ChevronRight className="ml-auto size-4" />}</Link></li>; })}</ul></nav>
    <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-900">{isDemo ? "PD" : initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{preferences.displayName}</p><p className="text-xs text-emerald-100/60">{isDemo ? "Data tanpa identitas pribadi" : "Profil EcoSpend Anda"}</p></div></div></div>
  </div>;
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markNotificationsRead } = useDashboardStore(); const unreadIds = notifications.filter((item) => item.status === "unread").map((item) => item.id);
  if (!open) return null;
  return <section aria-label="Panel notifikasi" className="absolute right-4 top-14 z-30 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:right-6 lg:right-8"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Notifikasi</h2><p className="text-xs text-slate-500">{unreadIds.length ? `${unreadIds.length} belum dibaca` : "Semua sudah dibaca"}</p></div><button type="button" onClick={onClose} aria-label="Tutup notifikasi" className="grid size-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4" /></button></div><ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{notifications.map((item) => <li key={item.id} className="py-3"><div className="flex gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.status === "unread" ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"}`} /><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.detail}</p></div></div></li>)}</ul>{unreadIds.length > 0 && <button type="button" onClick={() => void markNotificationsRead(unreadIds)} className="mt-3 min-h-10 w-full rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Tandai semua dibaca</button>}</section>;
}

function DataBoundary({ children }: { children: React.ReactNode }) {
  const { loading, error, retry } = useDashboardStore();
  if (loading) return <div role="status" className="grid min-h-[50vh] place-items-center text-sm font-semibold text-slate-500">Memuat data EcoSpend…</div>;
  if (error) return <div role="alert" className="mx-auto mt-12 max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900"><h1 className="font-bold">Data dasbor belum dapat dimuat</h1><p className="mt-2 text-sm">{error}</p><button type="button" onClick={() => void retry()} className="mt-4 min-h-10 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white">Coba lagi</button></div>;
  return children;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false); const [notificationOpen, setNotificationOpen] = useState(false);
  const pathname = usePathname(); const store = useDashboardStore(); const unread = store.notifications.filter((item) => item.status === "unread").length;
  useEffect(() => { const showFallback = () => setNotificationOpen(true); window.addEventListener("ecospend:in-app-notification", showFallback); return () => window.removeEventListener("ecospend:in-app-notification", showFallback); }, []);
  const current = navigation.find((item) => item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href));
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()), []);
  return <div className="min-h-screen bg-[#f5f7f6] text-slate-900 dark:bg-slate-950 dark:text-slate-100"><a href="#konten-utama" className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-lg bg-white px-4 py-2 font-semibold text-emerald-800 shadow focus:translate-y-0">Lewati ke konten utama</a>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><SidebarContent /></aside>{open && <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-[min(20rem,88vw)] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="relative h-full"><SidebarContent onNavigate={() => setOpen(false)} /><button type="button" onClick={() => setOpen(false)} aria-label="Tutup navigasi" className="absolute right-3 top-4 grid size-11 place-items-center rounded-xl text-white hover:bg-white/10"><X /></button></div></aside></div>}
    <div className="lg:pl-64"><header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85"><div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8"><button type="button" onClick={() => setOpen(true)} aria-label="Buka navigasi" aria-expanded={open} className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"><Menu /></button><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{current?.label ?? "EcoSpend"}</p><p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">{dateLabel} · {store.isDemo ? "Demo lokal" : "Data akun"}</p></div><ThemeControl compact /><div className="relative"><button type="button" onClick={() => setNotificationOpen((value) => !value)} aria-label={`Notifikasi, ${unread} belum dibaca`} aria-expanded={notificationOpen} aria-controls="notification-panel" className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Bell className="size-[18px]" />{unread > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-[10px] font-bold text-white">{unread}</span>}</button></div></div><div id="notification-panel"><NotificationPanel open={notificationOpen} onClose={() => setNotificationOpen(false)} /></div></header><main id="konten-utama" className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-10 lg:p-8"><DataBoundary>{children}</DataBoundary></main></div>
    <nav aria-label="Navigasi cepat seluler" className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95"><div className="grid grid-cols-5">{navigation.filter((_, index) => [0,1,3,4,7].includes(index)).map(({ href, label, icon: Icon }) => { const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={dashboardHref(href, store.isDemo)} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium ${active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}><Icon className="size-5" /><span>{label}</span></Link>; })}</div></nav><Toaster richColors position="top-right" />
  </div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";
  return isDemo ? <DemoProvider><AppShellInner>{children}</AppShellInner></DemoProvider> : <AuthenticatedStoreProvider><AppShellInner>{children}</AppShellInner></AuthenticatedStoreProvider>;
}
