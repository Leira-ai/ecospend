import { describe, expect, it } from "vitest";
import type { EmissionFactor, Transaction } from "../../types";
import { estimateCarbon } from "../carbon";
import { money } from "../money";

const base: Transaction = { id: "t", date: "2026-06-01", direction: "expense", amount: money(100_000n), accountId: "bank", categoryId: "transport", merchant: "Transit", paymentMethod: "qr", tags: [], createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z" };
const activity: EmissionFactor = { id: "activity", name: "Transit", method: "activity", activityType: "passenger-km", unit: "km", gramsPerUnitNumerator: 60n, gramsPerUnitDenominator: 1n, source: "Test", sourceYear: 2026, region: "ID", confidence: "high", confidenceBasisPoints: 9_000n };
const spend: EmissionFactor = { id: "spend", name: "Transport spend", method: "spend", categoryId: "transport", currency: "IDR", gramsPerMajorUnitNumerator: 1n, gramsPerMajorUnitDenominator: 100n, source: "Test", sourceYear: 2026, region: "ID", confidence: "low", confidenceBasisPoints: 4_000n };

describe("carbon", () => {
  it("prioritizes activity data and snapshots its factor", () => {
    const result = estimateCarbon({ ...base, activity: { type: "passenger-km", quantityMinor: 10n, quantityScale: 1n, unit: "km" } }, [spend, activity]);
    expect(result).toMatchObject({ available: true, method: "activity", gramsCo2e: 600n, confidence: "high" });
    if (result.available) expect(result.factor).toMatchObject({ id: "activity", snapshottedAt: base.updatedAt });
  });

  it("falls back to spend and reports unavailable results", () => {
    expect(estimateCarbon(base, [spend])).toMatchObject({ available: true, method: "spend", gramsCo2e: 1_000n });
    expect(estimateCarbon(base, [])).toEqual({ available: false, reason: "no-matching-factor" });
  });
});
