import type { CarbonEstimate, EmissionFactor, EmissionFactorSnapshot, Transaction } from "../types";
import { currencyFractionDigits, divideRounded } from "./money";

export function estimateCarbon(
  transaction: Transaction,
  factors: readonly EmissionFactor[],
  snapshottedAt = transaction.updatedAt,
): CarbonEstimate {
  if (transaction.activity) {
    if (transaction.activity.quantityMinor <= 0n || transaction.activity.quantityScale <= 0n) {
      return { available: false, reason: "invalid-activity" };
    }
    const activityFactor = factors.find((factor) =>
      factor.method === "activity" && factor.activityType === transaction.activity?.type &&
      factor.unit === transaction.activity?.unit
    );
    if (activityFactor?.method === "activity") {
      const grams = divideRounded(
        transaction.activity.quantityMinor * activityFactor.gramsPerUnitNumerator,
        transaction.activity.quantityScale * activityFactor.gramsPerUnitDenominator,
      );
      return availableEstimate(grams, activityFactor, snapshottedAt);
    }
  }

  const categoryFactor = factors.find((factor) =>
    factor.method === "spend" && factor.categoryId === transaction.categoryId &&
    factor.currency === transaction.amount.currency
  );
  const genericFactor = factors.find((factor) =>
    factor.method === "spend" && factor.categoryId === undefined && factor.currency === transaction.amount.currency
  );
  const spendFactor = categoryFactor ?? genericFactor;
  if (spendFactor?.method === "spend") {
    const scale = 10n ** BigInt(currencyFractionDigits(transaction.amount.currency));
    const grams = divideRounded(
      transaction.amount.amountMinor * spendFactor.gramsPerMajorUnitNumerator,
      scale * spendFactor.gramsPerMajorUnitDenominator,
    );
    return availableEstimate(grams, spendFactor, snapshottedAt);
  }
  if (factors.some((factor) => factor.method === "spend")) {
    return { available: false, reason: "unsupported-currency" };
  }
  return { available: false, reason: "no-matching-factor" };
}

function availableEstimate(
  gramsCo2e: bigint,
  factor: EmissionFactor,
  snapshottedAt: string,
): CarbonEstimate {
  const snapshot: EmissionFactorSnapshot = { ...factor, snapshottedAt };
  return {
    available: true,
    gramsCo2e,
    method: factor.method,
    confidence: factor.confidence,
    confidenceBasisPoints: factor.confidenceBasisPoints,
    factor: snapshot,
  };
}

export const CARBON_METHODOLOGY_VERSION = "2026.1";
export const CARBON_DATASET_SOURCE = "EcoSpend Indikatif ID 2026";

export function getCarbonConfidenceLabel(confidence: "high" | "medium" | "low" | undefined): string {
  switch (confidence) {
    case "high":
      return "Tinggi (Faktor terukur langsung)";
    case "medium":
      return "Sedang (Faktor proxy aktivitas)";
    case "low":
      return "Rendah (Estimasi berbasis belanja)";
    default:
      return "Indikatif";
  }
}

/** Converts grams CO2e to kilograms rounded deterministically to 2 decimal places */
export function formatGramsToKilogramsRounded(gramsCo2e: bigint): number {
  const scaled = divideRounded(gramsCo2e * 100n, 1000n);
  return Number(scaled) / 100;
}

export function sumCarbon(estimates: readonly CarbonEstimate[]): bigint {
  return estimates.reduce((total, estimate) => total + (estimate.available ? estimate.gramsCo2e : 0n), 0n);
}
