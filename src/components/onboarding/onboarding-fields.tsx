"use client";

import type { ChangeEvent } from "react";
import {
  supportedCurrencies,
  supportedThemes,
  supportedTimezones,
  type OnboardingValues,
  type ThemePreference,
} from "./model";

type Props = {
  values: OnboardingValues;
  disabled: boolean;
  onChange: (values: OnboardingValues) => void;
};

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export function OnboardingFields({ values, disabled, onChange }: Props) {
  const update = (patch: Partial<OnboardingValues>) => onChange({ ...values, ...patch });
  const notification = (event: ChangeEvent<HTMLInputElement>) => update({
    notifications: { ...values.notifications, [event.target.name]: event.target.checked },
  });

  return (
    <div className="space-y-8">
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-bold text-emerald-950 dark:text-emerald-100">Profil dasar</legend>
        <label className="sm:col-span-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Nama lengkap
          <input id="displayName" name="displayName" autoComplete="name" required maxLength={100} disabled={disabled} value={values.displayName} onChange={(event) => update({ displayName: event.target.value })} className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Mata uang utama
          <select name="currencyCode" disabled={disabled} value={values.currencyCode} onChange={(event) => update({ currencyCode: event.target.value })} className={inputClass}>
            {supportedCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Zona waktu
          <select name="timezone" disabled={disabled} value={values.timezone} onChange={(event) => update({ timezone: event.target.value })} className={inputClass}>
            {supportedTimezones.map((timezone) => <option key={timezone} value={timezone}>{timezone.replace("Asia/", "")}</option>)}
          </select>
        </label>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-1 text-lg font-bold text-emerald-950 dark:text-emerald-100">Rencana bulanan</legend>
        <p className="sm:col-span-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Nilai ini membantu EcoSpend menata periode anggaran dan target Anda. Anda dapat mengubahnya nanti.</p>
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Tanggal awal siklus (1–28)
          <input name="budgetCycleStart" type="number" inputMode="numeric" min={1} max={28} required disabled={disabled} value={values.budgetCycleStart} onChange={(event) => update({ budgetCycleStart: event.target.value })} className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Target tabungan bulanan ({values.currencyCode})
          <input name="savingsTarget" type="text" inputMode="decimal" required disabled={disabled} value={values.savingsTarget} onChange={(event) => update({ savingsTarget: event.target.value })} aria-describedby="savings-hint" className={inputClass} />
          <span id="savings-hint" className="mt-2 block text-xs font-normal leading-5 text-slate-500">Masukkan 0 jika belum ingin menetapkan target. Pemisah ribuan boleh digunakan.</span>
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-emerald-950 dark:text-emerald-100">Tampilan</legend>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {supportedThemes.map((theme) => (
            <label key={theme} className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-3 text-sm font-semibold has-checked:border-emerald-700 has-checked:bg-emerald-50 has-checked:text-emerald-900 dark:border-slate-700 dark:has-checked:bg-emerald-950">
              <input type="radio" name="theme" value={theme} checked={values.theme === theme} disabled={disabled} onChange={() => update({ theme: theme as ThemePreference })} className="sr-only" />
              {theme === "system" ? "Perangkat" : theme === "light" ? "Terang" : "Gelap"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-emerald-950 dark:text-emerald-100">Preferensi</legend>
        <div className="mt-4 space-y-3">
          {([ ["budgetAlerts", "Peringatan saat anggaran mendekati batas"], ["goalProgress", "Perkembangan target tabungan"], ["recurringDue", "Pengingat transaksi rutin"] ] as const).map(([name, label]) => (
            <label key={name} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <input type="checkbox" name={name} checked={values.notifications[name]} disabled={disabled} onChange={notification} className="mt-1 size-4 accent-emerald-700" />
              <span>{label}</span>
            </label>
          ))}
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <input type="checkbox" checked={values.carbonTracking} disabled={disabled} onChange={(event) => update({ carbonTracking: event.target.checked })} className="mt-1 size-4 accent-emerald-700" />
            <span><strong className="block text-slate-900 dark:text-white">Aktifkan estimasi jejak karbon</strong>Perkiraan bersifat indikatif, bukan pengukuran langsung atau audit lingkungan.</span>
          </label>
        </div>
      </fieldset>
    </div>
  );
}
