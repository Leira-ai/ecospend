"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export const buttonPrimary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(4_120_87/0.7)] transition hover:-translate-y-px hover:bg-emerald-800 hover:shadow-[0_14px_26px_-10px_rgb(4_120_87/0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none";
export const buttonSecondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-emerald-950 motion-reduce:transform-none motion-reduce:transition-none";
export const inputClass = "min-h-11 w-full rounded-xl border border-slate-300/90 bg-white px-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgb(15_23_42/0.05)] outline-none transition placeholder:text-slate-500 hover:border-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600";
export const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";
export const cardClass = "rounded-[1.4rem] border border-slate-200/70 bg-white shadow-[0_18px_40px_-28px_rgb(2_44_34/0.35)] dark:border-slate-800 dark:bg-slate-900";

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

export function MetricCard({ label, value, detail, icon, tone, index = 0 }: { label: string; value: string; detail?: string; icon: React.ReactNode; tone: string; index?: number }) {
  return (
    <section aria-label={label} className="animate-pop group relative overflow-hidden rounded-[1.4rem] border border-slate-200/70 bg-white p-5 shadow-[0_18px_40px_-28px_rgb(2_44_34/0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgb(2_44_34/0.45)] dark:border-slate-800 dark:bg-slate-900 motion-reduce:transform-none motion-reduce:transition-none" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-emerald-500/10 blur-2xl transition group-hover:bg-emerald-500/20" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
          <p className="mt-2 text-[1.7rem] font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">{value}</p>
          {detail && <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{detail}</p>}
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl shadow-inner ${tone}`}>{icon}</span>
      </div>
    </section>
  );
}

export function Progress({ value, tone = "emerald", label }: { value: number; tone?: "emerald" | "amber" | "rose" | "blue"; label: string }) {
  const colors = { emerald: "from-emerald-500 to-emerald-700", amber: "from-amber-400 to-amber-600", rose: "from-rose-500 to-rose-700", blue: "from-sky-500 to-blue-700" };
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(safe)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${colors[tone]}`} style={{ width: `${safe}%` }} />
    </div>
  );
}

export function SectionCard({ eyebrow, title, description, icon, children, action, className = "" }: { eyebrow?: string; title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={`${cardClass} overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100/90 p-5 sm:p-6 dark:border-slate-800">
        <div className="flex items-start gap-3">
          {icon && <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-700/[0.08] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{icon}</span>}
          <div>
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">{eyebrow}</p>}
            <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-300">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, title, description, onClose, children, size = "md" }: { open: boolean; title: string; description?: string; onClose: () => void; children: React.ReactNode; size?: "md" | "lg" | "xl" }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("h2, input, select, button")?.focus();
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])") ?? []).filter((el) => el.offsetParent !== null);
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !dialog) return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose, open]);
  if (!open) return null;
  const widths = { md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 dark:bg-slate-900 ${widths[size]}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 id={titleId} tabIndex={-1} className="text-xl font-bold text-slate-950 outline-none dark:text-white">{title}</h2>{description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>}</div>
          <button type="button" onClick={onClose} aria-label="Tutup dialog" className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-5" /></button>
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
      <span><span className="block text-sm font-medium text-slate-900 dark:text-white">{label}</span>{description && <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{description}</span>}</span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5 dark:bg-slate-700" />
    </label>
  );
}
