"use client";

import { X } from "lucide-react";
import { useEffect, useId } from "react";

export const buttonPrimary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50";
export const buttonSecondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-emerald-950";
export const inputClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";
export const cardClass = "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className = "", ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={`${cardClass} ${className}`} {...props}>{children}</section>;
}

export function Progress({ value, tone = "emerald", label }: { value: number; tone?: "emerald" | "amber" | "rose" | "blue"; label: string }) {
  const colors = { emerald: "bg-emerald-600", amber: "bg-amber-500", rose: "bg-rose-600", blue: "bg-blue-600" };
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(safe)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-full rounded-full transition-all ${colors[tone]}`} style={{ width: `${safe}%` }} />
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, title, description, onClose, children, size = "md" }: { open: boolean; title: string; description?: string; onClose: () => void; children: React.ReactNode; size?: "md" | "lg" | "xl" }) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose, open]);
  if (!open) return null;
  const widths = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 dark:bg-slate-900 ${widths[size]}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 id={titleId} className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Tutup dialog" className="grid min-h-10 min-w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Konfirmasi", danger = false, onConfirm, onClose }: { open: boolean; title: string; description: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return <Modal open={open} title={title} description={description} onClose={onClose}><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Batal</button><button type="button" onClick={() => { onConfirm(); onClose(); }} className={danger ? `${buttonPrimary} bg-rose-700 hover:bg-rose-800` : buttonPrimary}>{confirmLabel}</button></div></Modal>;
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (next: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span><span className="block text-sm font-medium text-slate-900 dark:text-white">{label}</span>{description && <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>}</span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5 dark:bg-slate-700" />
    </label>
  );
}
