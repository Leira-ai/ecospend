import type { CurrencyCode } from "./money";

export type CarbonConfidence = "high" | "medium" | "low";

interface EmissionFactorBase {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly sourceYear: number;
  readonly region: string;
  readonly confidence: CarbonConfidence;
  readonly confidenceBasisPoints: bigint;
}

export interface ActivityEmissionFactor extends EmissionFactorBase {
  readonly method: "activity";
  readonly activityType: string;
  readonly unit: string;
  readonly gramsPerUnitNumerator: bigint;
  readonly gramsPerUnitDenominator: bigint;
}

export interface SpendEmissionFactor extends EmissionFactorBase {
  readonly method: "spend";
  readonly categoryId?: string;
  readonly currency: CurrencyCode;
  readonly gramsPerMajorUnitNumerator: bigint;
  readonly gramsPerMajorUnitDenominator: bigint;
}

export type EmissionFactor = ActivityEmissionFactor | SpendEmissionFactor;

export type EmissionFactorSnapshot = EmissionFactor & {
  readonly snapshottedAt: string;
};

export type CarbonEstimate =
  | {
      readonly available: true;
      readonly gramsCo2e: bigint;
      readonly method: "activity" | "spend";
      readonly confidence: CarbonConfidence;
      readonly confidenceBasisPoints: bigint;
      readonly factor: EmissionFactorSnapshot;
    }
  | {
      readonly available: false;
      readonly reason: "no-matching-factor" | "invalid-activity" | "unsupported-currency";
    };
