import { describe, expect, it } from "vitest";
import {
  defaultOnboardingValues,
  hasCompletedOnboarding,
  onboardingMetadataKey,
  parseMoneyToMinor,
  safeOnboardingDestination,
  validateOnboarding,
} from "../model";

describe("onboarding model", () => {
  it("parses IDR without floating point precision loss", () => {
    expect(parseMoneyToMinor("1.250.000", "IDR")).toBe(1_250_000);
    expect(parseMoneyToMinor("1,250,000", "IDR")).toBe(1_250_000);
    expect(parseMoneyToMinor("9007199254740992", "IDR")).toBeNull();
    expect(parseMoneyToMinor("12,50", "IDR")).toBeNull();
  });

  it("parses decimal currencies into minor units", () => {
    expect(parseMoneyToMinor("1234.56", "USD")).toBe(123_456);
    expect(parseMoneyToMinor("1.234,56", "EUR")).toBe(123_456);
    expect(parseMoneyToMinor("0,5", "SGD")).toBe(50);
    expect(parseMoneyToMinor("-10", "USD")).toBeNull();
  });

  it("validates all required values and the cycle boundary", () => {
    expect(validateOnboarding({ ...defaultOnboardingValues, displayName: "  Rani Putri  ", budgetCycleStart: "28" })).toMatchObject({
      valid: true,
      displayName: "Rani Putri",
      budgetCycleStart: 28,
    });
    expect(validateOnboarding({ ...defaultOnboardingValues, displayName: "Rani", budgetCycleStart: "29" })).toEqual({
      valid: false,
      field: "budgetCycleStart",
      message: "Tanggal awal siklus harus antara 1 dan 28.",
    });
  });

  it("recognizes only a complete versioned onboarding marker", () => {
    expect(hasCompletedOnboarding({ [onboardingMetadataKey]: { version: 1, completed_at: "2026-09-08T10:00:00.000Z" } })).toBe(true);
    expect(hasCompletedOnboarding({ [onboardingMetadataKey]: { version: 1 } })).toBe(false);
    expect(hasCompletedOnboarding({ completed_at: "2026-09-08T10:00:00.000Z" })).toBe(false);
  });

  it("allows only internal dashboard destinations", () => {
    expect(safeOnboardingDestination("/dashboard/transaksi?new=1")).toBe("/dashboard/transaksi?new=1");
    expect(safeOnboardingDestination("/dashboard?demo=1")).toBe("/dashboard");
    expect(safeOnboardingDestination("//evil.test/dashboard")).toBe("/dashboard");
    expect(safeOnboardingDestination("https://evil.test/dashboard")).toBe("/dashboard");
    expect(safeOnboardingDestination("/onboarding")).toBe("/dashboard");
  });
});
