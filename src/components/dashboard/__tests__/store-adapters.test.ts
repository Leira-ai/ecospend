import { describe, expect, it } from "vitest";
import { mapTransactions, parseSafeMinor, toMinorString, type ApiRecord } from "../store-adapters";

const record = (value: Record<string, unknown>): ApiRecord => value;

describe("dashboard store adapters", () => {
  it("maps safe decimal-string minor units without floating-point parsing", () => {
    expect(parseSafeMinor("9007199254740991")).toBe(Number.MAX_SAFE_INTEGER);
    expect(toMinorString(Number.MAX_SAFE_INTEGER)).toBe("9007199254740991");
    expect(() => parseSafeMinor("9007199254740992")).toThrow(/rentang aman/);
    expect(() => parseSafeMinor("12.5")).toThrow(/string bilangan bulat/);
    expect(() => toMinorString(1.5)).toThrow(/bilangan bulat aman/);
  });

  it("joins snake_case records and collapses transfer pairs", () => {
    const accounts = new Map([["a1", "Bank"], ["a2", "Dompet"]]);
    const categories = new Map([["c1", "Makanan"]]);
    const rows = [
      record({ id: "t1", account_id: "a1", category_id: "c1", kind: "expense", source: "manual", amount_minor: "12000", merchant_name: "Pasar", description: "", transacted_at: "2026-09-08T01:00:00Z" }),
      record({ id: "td", account_id: "a1", kind: "transfer_debit", source: "transfer", transfer_group_id: "g1", amount_minor: "5000", description: "Isi saldo", transacted_at: "2026-09-07T01:00:00Z" }),
      record({ id: "tc", account_id: "a2", kind: "transfer_credit", source: "transfer", transfer_group_id: "g1", amount_minor: "5000", description: "Isi saldo", transacted_at: "2026-09-07T01:00:00Z" }),
    ];
    expect(mapTransactions(rows, accounts, categories, new Map([["t1", 1.25]]))).toEqual([
      expect.objectContaining({ id: "t1", account: "Bank", category: "Makanan", amount: 12000, carbonKg: 1.25, type: "pengeluaran" }),
      expect.objectContaining({ id: "g1", account: "Bank", destinationAccount: "Dompet", amount: 5000, type: "transfer" }),
    ]);
  });
});
