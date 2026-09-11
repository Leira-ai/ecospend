"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, LoaderCircle, ShieldCheck } from "lucide-react";
import { LeafCoin } from "@/components/brand/leaf-coin";
import { useTheme } from "next-themes";
import { type FormEvent, useState } from "react";
import { createOptionalBrowserClient } from "@/lib/supabase/client";
import {
  defaultOnboardingValues,
  onboardingMetadataKey,
  safeOnboardingDestination,
  validateOnboarding,
  type OnboardingMetadata,
  type OnboardingValues,
} from "./model";
import { OnboardingFields } from "./onboarding-fields";

type Props = {
  destination: string;
  initialValues?: Partial<OnboardingValues>;
  configurationMessage?: string;
};

type Feedback = { tone: "error" | "unavailable"; message: string };

export function OnboardingForm({ destination, initialValues, configurationMessage }: Props) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [values, setValues] = useState<OnboardingValues>({
    displayName: initialValues?.displayName ?? defaultOnboardingValues.displayName,
    currencyCode: initialValues?.currencyCode ?? defaultOnboardingValues.currencyCode,
    timezone: initialValues?.timezone ?? defaultOnboardingValues.timezone,
    budgetCycleStart: initialValues?.budgetCycleStart ?? defaultOnboardingValues.budgetCycleStart,
    savingsTarget: initialValues?.savingsTarget ?? defaultOnboardingValues.savingsTarget,
    theme: initialValues?.theme ?? defaultOnboardingValues.theme,
    notifications: { ...defaultOnboardingValues.notifications, ...initialValues?.notifications },
    carbonTracking: initialValues?.carbonTracking ?? defaultOnboardingValues.carbonTracking,
  });
  const [feedback, setFeedback] = useState<Feedback | null>(configurationMessage ? { tone: "unavailable", message: configurationMessage } : null);
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateOnboarding(values);
    if (!validation.valid) {
      setFeedback({ tone: "error", message: validation.message });
      document.getElementsByName(validation.field)[0]?.focus();
      return;
    }

    const result = createOptionalBrowserClient();
    if (!result.configured) {
      setFeedback({ tone: "unavailable", message: result.message });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const { data: authData, error: authError } = await result.client.auth.getUser();
      if (authError || !authData.user) {
        setFeedback({ tone: "error", message: "Sesi Anda berakhir. Silakan masuk kembali." });
        return;
      }

      const { data: profile, error: profileError } = await result.client.from("profiles").update({
        display_name: validation.displayName,
        currency_code: values.currencyCode,
        timezone: values.timezone,
      }).eq("id", authData.user.id).select("id").maybeSingle();
      if (profileError) throw profileError;
      if (!profile) {
        setFeedback({ tone: "error", message: "Profil akun belum tersedia. Keluar lalu masuk kembali, atau hubungi pengelola EcoSpend." });
        return;
      }

      const metadata: OnboardingMetadata = {
        version: 1,
        completed_at: new Date().toISOString(),
        budget_cycle_start: validation.budgetCycleStart,
        monthly_savings_target_minor: validation.savingsTargetMinor,
        currency_code: values.currencyCode,
        theme: values.theme,
        notifications: values.notifications,
        carbon_tracking: values.carbonTracking,
      };
      const { error: metadataError } = await result.client.auth.updateUser({ data: {
        ...authData.user.user_metadata,
        display_name: validation.displayName,
        [onboardingMetadataKey]: metadata,
      } });
      if (metadataError) throw metadataError;

      setTheme(values.theme);
      router.replace(safeOnboardingDestination(destination));
      router.refresh();
    } catch {
      setFeedback({ tone: "error", message: "Pengaturan belum tersimpan. Periksa koneksi lalu coba lagi." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8f5] px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-3xl bg-emerald-950 p-7 text-white lg:sticky lg:top-8 lg:h-fit lg:p-9">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold"><LeafCoin className="size-10" />EcoSpend</Link>
          <p className="mt-12 text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Langkah opsional</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Siapkan pengalaman Anda</h1>
          <p className="mt-4 leading-7 text-emerald-100/75">Beri tahu preferensi dasar agar anggaran, target, dan estimasi EcoSpend lebih relevan.</p>
          <div className="mt-8 flex gap-3 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-emerald-100/75"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-lime-300" aria-hidden="true" /><p>Kami tidak meminta nomor rekening, kartu, atau PIN dalam proses ini.</p></div>
        </aside>

        <section className="rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-xl shadow-emerald-950/5 dark:border-white/10 dark:bg-slate-900 sm:p-8 lg:p-10" aria-labelledby="onboarding-heading">
          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-700 dark:text-lime-300">Preferensi akun</p>
            <h2 id="onboarding-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Mulai dengan pengaturan yang nyaman</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Semua pilihan dapat diperbarui nanti. Isi yang penting bagi Anda sekarang.</p>
          </div>
          <form onSubmit={submit} noValidate aria-describedby={feedback ? "onboarding-feedback" : undefined}>
            <OnboardingFields values={values} disabled={isSaving || Boolean(configurationMessage)} onChange={setValues} />
            {feedback && (
              <div id="onboarding-feedback" role={feedback.tone === "error" ? "alert" : "status"} className={`mt-6 rounded-xl border p-4 text-sm leading-6 ${feedback.tone === "error" ? "border-red-900/15 bg-red-50 text-red-950" : "border-amber-900/15 bg-amber-50 text-amber-950"}`}>
                <p className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{feedback.message}</p>
              </div>
            )}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/dashboard?demo=1" className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300">Lewati dan lihat demo</Link>
              <button type="submit" disabled={isSaving || Boolean(configurationMessage)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
                {isSaving ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                {isSaving ? "Menyimpan…" : "Simpan dan lanjutkan"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
