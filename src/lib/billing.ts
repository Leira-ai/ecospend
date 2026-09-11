export type PlanTier = "free" | "pro";

export interface PlanLimits {
  readonly tier: PlanTier;
  readonly name: string;
  readonly maxMonthlyTransactions: number;
  readonly maxAccounts: number;
  readonly allowAttachments: boolean;
  readonly allowBulkImport: boolean;
  readonly allowCustomExport: boolean;
  readonly prioritySupport: boolean;
}

export const PLAN_CONFIGS: Readonly<Record<PlanTier, PlanLimits>> = {
  free: {
    tier: "free",
    name: "Pemula (Gratis)",
    maxMonthlyTransactions: 50,
    maxAccounts: 1,
    allowAttachments: false,
    allowBulkImport: false,
    allowCustomExport: false,
    prioritySupport: false,
  },
  pro: {
    tier: "pro",
    name: "EcoSpend Pro",
    maxMonthlyTransactions: Number.POSITIVE_INFINITY,
    maxAccounts: Number.POSITIVE_INFINITY,
    allowAttachments: true,
    allowBulkImport: true,
    allowCustomExport: true,
    prioritySupport: true,
  },
};

export function getPlanLimits(tier: PlanTier = "free"): PlanLimits {
  return PLAN_CONFIGS[tier] ?? PLAN_CONFIGS.free;
}

export function canCreateTransaction(tier: PlanTier, currentMonthCount: number): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(tier);
  if (currentMonthCount >= limits.maxMonthlyTransactions) {
    return {
      allowed: false,
      reason: `Batas transaksi bulanan paket gratis (${limits.maxMonthlyTransactions} transaksi) telah tercapai. Tingkatkan ke Pro untuk pencatatan tanpa batas.`,
    };
  }
  return { allowed: true };
}

export function canCreateAccount(tier: PlanTier, currentAccountCount: number): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(tier);
  if (currentAccountCount >= limits.maxAccounts) {
    return {
      allowed: false,
      reason: `Paket gratis dibatasi maksimal ${limits.maxAccounts} akun. Tingkatkan ke Pro untuk mengelola rekening bank dan e-wallet tak terbatas.`,
    };
  }
  return { allowed: true };
}

export function canUploadAttachment(tier: PlanTier): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(tier);
  if (!limits.allowAttachments) {
    return {
      allowed: false,
      reason: "Penyimpanan foto struk privat adalah fitur EcoSpend Pro. Tingkatkan akun Anda untuk mengunggah bukti transaksi.",
    };
  }
  return { allowed: true };
}

export function canBulkImport(tier: PlanTier): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(tier);
  if (!limits.allowBulkImport) {
    return {
      allowed: false,
      reason: "Impor massal mutasi bank tanpa batas adalah fitur EcoSpend Pro. Tingkatkan akun untuk memproses ratusan transaksi otomatis.",
    };
  }
  return { allowed: true };
}
