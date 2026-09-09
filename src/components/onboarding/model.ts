export const supportedCurrencies = ["IDR", "USD", "SGD", "EUR"] as const;
export const supportedTimezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;
export const supportedThemes = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof supportedThemes)[number];
export type NotificationPreferences = {
  budgetAlerts: boolean;
  goalProgress: boolean;
  recurringDue: boolean;
};

export type OnboardingValues = {
  displayName: string;
  currencyCode: string;
  timezone: string;
  budgetCycleStart: string;
  savingsTarget: string;
  theme: ThemePreference;
  notifications: NotificationPreferences;
  carbonTracking: boolean;
};

export const defaultOnboardingValues: OnboardingValues = {
  displayName: "",
  currencyCode: "IDR",
  timezone: "Asia/Jakarta",
  budgetCycleStart: "1",
  savingsTarget: "0",
  theme: "system",
  notifications: { budgetAlerts: true, goalProgress: true, recurringDue: true },
  carbonTracking: true,
};

const zeroDecimalCurrencies = new Set(["IDR"]);
const maximumMinorUnits = BigInt(Number.MAX_SAFE_INTEGER);

type ParsedAmount = { major: string; fraction: string };

function splitDecimalAmount(value: string): ParsedAmount | null {
  if (/^\d+$/.test(value)) return { major: value, fraction: "" };
  if (/^\d+[.,]\d{1,2}$/.test(value)) {
    const separator = Math.max(value.lastIndexOf("."), value.lastIndexOf(","));
    return { major: value.slice(0, separator), fraction: value.slice(separator + 1) };
  }
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(value)) {
    return { major: value.replace(/[.,]/g, ""), fraction: "" };
  }
  const dotGrouped = value.match(/^(\d{1,3}(?:\.\d{3})+),(\d{1,2})$/);
  if (dotGrouped) return { major: dotGrouped[1].replaceAll(".", ""), fraction: dotGrouped[2] };
  const commaGrouped = value.match(/^(\d{1,3}(?:,\d{3})+)\.(\d{1,2})$/);
  if (commaGrouped) return { major: commaGrouped[1].replaceAll(",", ""), fraction: commaGrouped[2] };
  return null;
}

export function parseMoneyToMinor(value: string, currencyCode: string): number | null {
  const normalized = value.trim().replace(/[\s\u00a0]/g, "");
  if (!normalized) return null;

  let digits: string;
  if (zeroDecimalCurrencies.has(currencyCode)) {
    if (/^\d+$/.test(normalized)) digits = normalized;
    else if (/^\d{1,3}(?:[.,]\d{3})+$/.test(normalized)) digits = normalized.replace(/[.,]/g, "");
    else return null;
  } else {
    const parsed = splitDecimalAmount(normalized);
    if (!parsed) return null;
    digits = `${parsed.major}${parsed.fraction.padEnd(2, "0")}`;
  }

  try {
    const amount = BigInt(digits);
    return amount <= maximumMinorUnits ? Number(amount) : null;
  } catch {
    return null;
  }
}

export function formatMinorForInput(value: unknown, currencyCode: string): string {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return "0";
  if (zeroDecimalCurrencies.has(currencyCode)) return String(value);
  const digits = String(value).padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export type ValidationResult =
  | { valid: true; displayName: string; budgetCycleStart: number; savingsTargetMinor: number }
  | { valid: false; message: string; field: keyof OnboardingValues };

export function validateOnboarding(values: OnboardingValues): ValidationResult {
  const displayName = values.displayName.trim().replace(/\s+/g, " ");
  if (!displayName || displayName.length > 100) {
    return { valid: false, message: "Nama lengkap wajib diisi, maksimal 100 karakter.", field: "displayName" };
  }
  if (!supportedCurrencies.includes(values.currencyCode as (typeof supportedCurrencies)[number])) {
    return { valid: false, message: "Pilih mata uang yang tersedia.", field: "currencyCode" };
  }
  if (!supportedTimezones.includes(values.timezone as (typeof supportedTimezones)[number])) {
    return { valid: false, message: "Pilih zona waktu yang tersedia.", field: "timezone" };
  }
  if (!/^\d{1,2}$/.test(values.budgetCycleStart)) {
    return { valid: false, message: "Tanggal awal siklus harus berupa angka 1–28.", field: "budgetCycleStart" };
  }
  const budgetCycleStart = Number(values.budgetCycleStart);
  if (budgetCycleStart < 1 || budgetCycleStart > 28) {
    return { valid: false, message: "Tanggal awal siklus harus antara 1 dan 28.", field: "budgetCycleStart" };
  }
  const savingsTargetMinor = parseMoneyToMinor(values.savingsTarget, values.currencyCode);
  if (savingsTargetMinor === null) {
    return { valid: false, message: "Target tabungan tidak valid atau terlalu besar.", field: "savingsTarget" };
  }
  return { valid: true, displayName, budgetCycleStart, savingsTargetMinor };
}

// The namespace keeps app-managed preferences separate from provider metadata.
export const onboardingMetadataKey = "ecospend_onboarding";

export type OnboardingMetadata = {
  version: 1;
  completed_at: string;
  budget_cycle_start: number;
  monthly_savings_target_minor: number;
  currency_code: string;
  theme: ThemePreference;
  notifications: NotificationPreferences;
  carbon_tracking: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function metadataFrom(value: unknown): Partial<OnboardingMetadata> | null {
  if (!isRecord(value) || !isRecord(value[onboardingMetadataKey])) return null;
  return value[onboardingMetadataKey] as Partial<OnboardingMetadata>;
}

export function hasCompletedOnboarding(value: unknown): boolean {
  const metadata = metadataFrom(value);
  return metadata?.version === 1
    && typeof metadata.completed_at === "string"
    && !Number.isNaN(Date.parse(metadata.completed_at));
}

export function safeOnboardingDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/dashboard";
  try {
    const url = new URL(value, "https://ecospend.local");
    if (url.origin !== "https://ecospend.local" || url.username || url.password || url.hash) return "/dashboard";
    if (url.pathname !== "/dashboard" && !url.pathname.startsWith("/dashboard/")) return "/dashboard";
    url.searchParams.delete("demo");
    const query = url.searchParams.toString();
    return `${url.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return "/dashboard";
  }
}
