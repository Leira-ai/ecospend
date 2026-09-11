import { describe, expect, it } from "vitest";
import {
  canBulkImport,
  canCreateAccount,
  canCreateTransaction,
  canUploadAttachment,
  getPlanLimits,
  PLAN_CONFIGS,
} from "../billing";

describe("billing entitlements and plan limits", () => {
  it("defines strict free plan quotas", () => {
    expect(PLAN_CONFIGS.free.maxMonthlyTransactions).toBe(50);
    expect(PLAN_CONFIGS.free.maxAccounts).toBe(1);
    expect(PLAN_CONFIGS.free.allowAttachments).toBe(false);
  });

  it("defines unlimited Pro plan quotas", () => {
    expect(PLAN_CONFIGS.pro.maxMonthlyTransactions).toBe(Number.POSITIVE_INFINITY);
    expect(PLAN_CONFIGS.pro.maxAccounts).toBe(Number.POSITIVE_INFINITY);
    expect(PLAN_CONFIGS.pro.allowAttachments).toBe(true);
  });

  it("prevents free users from creating transaction 51", () => {
    expect(canCreateTransaction("free", 49).allowed).toBe(true);
    const atLimit = canCreateTransaction("free", 50);
    expect(atLimit.allowed).toBe(false);
    expect(atLimit.reason).toContain("50 transaksi");
  });

  it("allows Pro users unlimited transactions", () => {
    expect(canCreateTransaction("pro", 1_000_000).allowed).toBe(true);
  });

  it("prevents free users from creating a second account", () => {
    expect(canCreateAccount("free", 0).allowed).toBe(true);
    const result = canCreateAccount("free", 1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("maksimal 1 akun");
  });

  it("protects Pro-only attachment and import features", () => {
    expect(canUploadAttachment("free").allowed).toBe(false);
    expect(canBulkImport("free").allowed).toBe(false);
    expect(canUploadAttachment("pro").allowed).toBe(true);
    expect(canBulkImport("pro").allowed).toBe(true);
  });

  it("returns correct plan details", () => {
    expect(getPlanLimits("free").name).toBe("Pemula (Gratis)");
    expect(getPlanLimits("pro").name).toBe("EcoSpend Pro");
  });
});
