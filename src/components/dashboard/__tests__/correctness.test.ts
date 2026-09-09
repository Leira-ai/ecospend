import { describe, expect, it } from "vitest";
import { DEMO_CURRENT_PERIOD, estimateDemoTransactionCarbon, initialDemoState } from "../demo-data";
import { applyMerchantRule, deriveAccounts, goalContributionLimits, normalizeDemoTransaction } from "../demo-store";
import { sanitizeSpreadsheetCell, toCsv } from "../format";
import type { Goal, Transaction } from "../types";

const expense = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "tx", date: `${DEMO_CURRENT_PERIOD}-08`, name: "PLN tagihan", category: "Lainnya",
  account: "Bank Utama", type: "pengeluaran", amount: 100_000, carbonKg: 999, ...overrides,
});

describe("demo calculation contracts", () => {
  it("derives account balances and preserves transfer total atomically", () => {
    const accounts = initialDemoState.accounts.slice(0, 2).map((item) => ({ ...item, balance: 1_000_000 }));
    const transfer = expense({ type: "transfer", category: "Transfer", amount: 250_000, destinationAccount: accounts[1].name, carbonKg: 100 });
    const balances = deriveAccounts(accounts, [transfer]);

    expect(balances[0].balance).toBe(750_000);
    expect(balances[1].balance).toBe(1_250_000);
    expect(balances.reduce((sum, item) => sum + item.balance, 0)).toBe(2_000_000);
    expect(normalizeDemoTransaction(transfer, [], "rata-rata").carbonKg).toBe(0);
  });

  it("applies merchant rules before deterministic carbon estimation", () => {
    const rules = [{ id: "pln", merchant: "PLN", category: "Tagihan" }];
    const categorized = applyMerchantRule(expense(), rules);
    const normalized = normalizeDemoTransaction(expense(), rules, "rata-rata");

    expect(categorized.category).toBe("Tagihan");
    expect(normalized.carbonKg).toBe(estimateDemoTransactionCarbon({ ...expense(), category: "Tagihan" }).carbonKg);
    expect(normalized.carbonKg).not.toBe(999);
  });

  it("enforces completed, past, zero, and withdrawal goal limits", () => {
    const goal: Goal = { id: "g", name: "Goal", target: 1_000, saved: 800, deadline: "2027-01-01", icon: "leaf" };
    expect(goalContributionLimits(goal)).toMatchObject({ canContribute: true, canWithdraw: true, maximumContribution: 200, maximumWithdrawal: 800 });
    expect(goalContributionLimits({ ...goal, saved: 1_000 }).canContribute).toBe(false);
    expect(goalContributionLimits({ ...goal, deadline: "2026-01-01" }).canContribute).toBe(false);
    expect(goalContributionLimits({ ...goal, target: 0, saved: 0 })).toMatchObject({ canContribute: false, canWithdraw: false });
  });

  it("neutralizes spreadsheet formula prefixes for CSV and XLSX rows", () => {
    expect(sanitizeSpreadsheetCell("=HYPERLINK(\"bad\")")).toBe("'=HYPERLINK(\"bad\")");
    expect(sanitizeSpreadsheetCell("  +SUM(1,1)")).toBe("'  +SUM(1,1)");
    expect(toCsv([{ Nama: "@malicious", Nominal: 1 }])).toContain("\"'@malicious\"");
  });
});
