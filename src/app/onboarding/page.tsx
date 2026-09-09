import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import {
  formatMinorForInput,
  hasCompletedOnboarding,
  metadataFrom,
  safeOnboardingDestination,
  type NotificationPreferences,
  type OnboardingValues,
  type ThemePreference,
} from "@/components/onboarding/model";
import { createOptionalServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Siapkan akun",
  description: "Atur preferensi dasar akun EcoSpend Anda.",
};

type Profile = { display_name: string | null; currency_code: string; timezone: string };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = safeOnboardingDestination(next);
  const result = createOptionalServerClient(await cookies());
  if (!result.configured) {
    return <OnboardingForm destination={destination} configurationMessage={result.message} />;
  }

  const { data: authData } = await result.client.auth.getUser();
  const user = authData.user;
  if (!user) redirect(`/login?auth_required=1`);
  if (hasCompletedOnboarding(user.user_metadata)) redirect(destination);

  const { data } = await result.client.from("profiles")
    .select("display_name,currency_code,timezone")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  const preference = metadataFrom(user.user_metadata);
  const currencyCode = data?.currency_code ?? preference?.currency_code ?? "IDR";
  const storedTheme = preference?.theme;
  const storedNotifications = preference?.notifications;
  const initialValues: Partial<OnboardingValues> = {
    displayName: data?.display_name ?? (typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : ""),
    currencyCode,
    timezone: data?.timezone ?? "Asia/Jakarta",
    budgetCycleStart: typeof preference?.budget_cycle_start === "number" ? String(preference.budget_cycle_start) : "1",
    savingsTarget: formatMinorForInput(preference?.monthly_savings_target_minor, currencyCode),
    ...(storedTheme === "system" || storedTheme === "light" || storedTheme === "dark" ? { theme: storedTheme as ThemePreference } : {}),
    ...(storedNotifications && typeof storedNotifications === "object" ? { notifications: storedNotifications as NotificationPreferences } : {}),
    ...(typeof preference?.carbon_tracking === "boolean" ? { carbonTracking: preference.carbon_tracking } : {}),
  };

  return <OnboardingForm destination={destination} initialValues={initialValues} />;
}
