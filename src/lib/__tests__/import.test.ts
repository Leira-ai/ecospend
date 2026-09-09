import { describe, expect, it } from "vitest";
import { categorizeMerchant, normalizeMerchant } from "../categorization";
import { DEMO_ACCOUNTS, DEMO_CATEGORIES } from "../demoConstants";
import { parseCsv, parseImportRecords, transactionFingerprint } from "../import";

describe("categorization and import", () => {
  it("normalizes noisy merchant labels and returns confidence", () => {
    expect(normalizeMerchant("PT. SUPERINDO INDONESIA - TRX #A123")).toBe("superindo");
    expect(categorizeMerchant("PT Superindo Indonesia", [{ id: "r", categoryId: "groceries", merchantPatterns: ["superindo"], confidenceBasisPoints: 9_500n, priority: 1 }]))
      .toMatchObject({ categoryId: "groceries", confidenceBasisPoints: 9_500n, matchedRuleId: "r" });
  });

  it("parses CSV, validates domain references and detects duplicate fingerprints", () => {
    const records = parseCsv("tanggal,jenis,nominal,akun,kategori,deskripsi,metode\n01/06/2026,pengeluaran,50000,Rekening Utama,Makan & Minum,Warung Demo,QRIS");
    const first = parseImportRecords(records, { accounts: DEMO_ACCOUNTS, categories: DEMO_CATEGORIES });
    expect(first.errors).toEqual([]);
    expect(first.transactions[0]?.duplicate).toBe(false);
    const existing = first.transactions[0]?.transaction;
    expect(existing).toBeDefined();
    if (existing) {
      const second = parseImportRecords(records, { accounts: DEMO_ACCOUNTS, categories: DEMO_CATEGORIES, existingTransactions: [existing] });
      expect(second.transactions[0]?.duplicate).toBe(true);
      expect(transactionFingerprint(existing)).toBe(second.transactions[0]?.fingerprint);
    }
  });
});
