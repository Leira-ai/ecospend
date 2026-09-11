import { describe, expect, it } from "vitest";
import { formatGramsToKilogramsRounded, getCarbonConfidenceLabel, CARBON_METHODOLOGY_VERSION, CARBON_DATASET_SOURCE } from "../carbon";
import { computePercentageChange, getBudgetThresholdStatus, getCashFlowStatus, getCategoryColor } from "../finance";
import { money } from "../money";

describe("finance health and calculation integrity", () => {
  it("computes cash flow health status correctly", () => {
    const income = money(10_000_000n, "IDR");
    const expenseLess = money(6_000_000n, "IDR");
    const expenseMore = money(12_000_000n, "IDR");
    const expenseEqual = money(10_000_000n, "IDR");

    expect(getCashFlowStatus(income, expenseLess)).toEqual({
      status: "surplus",
      label: "Surplus kas sehat",
      tone: "emerald",
    });

    expect(getCashFlowStatus(income, expenseMore)).toEqual({
      status: "deficit",
      label: "Pengeluaran melebihi pemasukan",
      tone: "rose",
    });

    expect(getCashFlowStatus(income, expenseEqual)).toEqual({
      status: "balanced",
      label: "Arus kas seimbang",
      tone: "slate",
    });
  });

  it("calculates percentage changes safely including zero division", () => {
    expect(computePercentageChange(120, 100)).toBe(20);
    expect(computePercentageChange(80, 100)).toBe(-20);
    expect(computePercentageChange(100n, 0n)).toBe(100);
    expect(computePercentageChange(-50n, 0n)).toBe(-100);
    expect(computePercentageChange(0, 0)).toBe(0);
  });

  it("evaluates budget threshold boundaries (normal, 80% warning, 100% exceeded)", () => {
    const limit = money(1_000_000n, "IDR");
    expect(getBudgetThresholdStatus(money(500_000n, "IDR"), limit)).toBe("normal");
    expect(getBudgetThresholdStatus(money(800_000n, "IDR"), limit)).toBe("warning");
    expect(getBudgetThresholdStatus(money(950_000n, "IDR"), limit)).toBe("warning");
    expect(getBudgetThresholdStatus(money(1_000_000n, "IDR"), limit)).toBe("exceeded");
    expect(getBudgetThresholdStatus(money(1_200_000n, "IDR"), limit)).toBe("exceeded");
  });

  it("maps category colors deterministically", () => {
    expect(getCategoryColor("Makanan & Minuman")).toBe("#10b981");
    expect(getCategoryColor("Transportasi")).toBe("#0ea5e9");
    expect(getCategoryColor("NonExistentCategory")).toBe("#10b981");
  });

  it("exposes carbon methodology versioning and confidence labels", () => {
    expect(CARBON_METHODOLOGY_VERSION).toBe("2026.1");
    expect(CARBON_DATASET_SOURCE).toBe("EcoSpend Indikatif ID 2026");
    expect(getCarbonConfidenceLabel("high")).toContain("Tinggi");
    expect(getCarbonConfidenceLabel("medium")).toContain("Sedang");
    expect(getCarbonConfidenceLabel("low")).toContain("Rendah");
    expect(getCarbonConfidenceLabel(undefined)).toBe("Indikatif");
  });

  it("rounds carbon emissions to 2 decimal places deterministically", () => {
    expect(formatGramsToKilogramsRounded(1234n)).toBe(1.23);
    expect(formatGramsToKilogramsRounded(1235n)).toBe(1.24);
    expect(formatGramsToKilogramsRounded(50n)).toBe(0.05);
    expect(formatGramsToKilogramsRounded(0n)).toBe(0);
  });
});
