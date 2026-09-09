import { describe, expect, it } from "vitest";
import type { Account, Budget, Goal, Transaction } from "../../types";
import { accountBalance, budgetStatus, financeSummary, goalProgress, validateTransfer } from "../finance";
import { money } from "../money";

const account = (id: string): Account => ({ id, name: id, type: "bank", openingBalance: money(1_000n), color: "#000", archived: false });
const transaction = (changes: Partial<Transaction> & Pick<Transaction, "id" | "direction" | "amount" | "accountId">): Transaction => ({
  date: "2026-06-01", merchant: "Demo", paymentMethod: "cash", tags: [], createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z", ...changes,
});

describe("finance", () => {
  const transactions: readonly Transaction[] = [
    transaction({ id: "income", direction: "income", amount: money(2_000n), accountId: "a", categoryId: "salary" }),
    transaction({ id: "expense", direction: "expense", amount: money(500n), accountId: "a", categoryId: "food" }),
    transaction({ id: "transfer", direction: "transfer", amount: money(300n), accountId: "a", transferAccountId: "b" }),
  ];

  it("computes balances and excludes transfers from cash flow", () => {
    expect(accountBalance(account("a"), transactions).amountMinor).toBe(2_200n);
    expect(accountBalance(account("b"), transactions).amountMinor).toBe(1_300n);
    expect(financeSummary(transactions)).toMatchObject({ income: money(2_000n), expense: money(500n), cashFlow: money(1_500n) });
  });

  it("computes budget utilization", () => {
    const budget: Budget = { id: "budget", name: "Food", categoryIds: ["food"], limit: money(1_000n), month: "2026-06", rollover: false };
    expect(budgetStatus(budget, transactions)).toMatchObject({ spent: money(500n), remaining: money(500n), exceeded: false });
    expect(budgetStatus(budget, transactions).utilization.basisPoints).toBe(5_000n);
  });

  it("computes goal contributions", () => {
    const goal: Goal = { id: "goal", name: "Goal", target: money(10_000n), initialAmount: money(1_000n), targetDate: "2027-01-01", status: "active", color: "#000", contributions: [{ id: "c1", date: "2026-06-01", amount: money(2_000n), accountId: "a" }] };
    expect(goalProgress(goal)).toMatchObject({ saved: money(3_000n), remaining: money(7_000n), completed: false });
    expect(goalProgress(goal).progress.basisPoints).toBe(3_000n);
  });

  it("validates transfer invariants", () => {
    const valid = transaction({ id: "transfer", direction: "transfer", amount: money(100n), accountId: "a", transferAccountId: "b" });
    expect(validateTransfer(valid, [account("a"), account("b")]).valid).toBe(true);
    expect(validateTransfer({ ...valid, transferAccountId: "a" }, [account("a")]).valid).toBe(false);
  });
});
