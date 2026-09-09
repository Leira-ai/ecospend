import { describe, expect, it } from "vitest";
import { positiveMinorSchema, signedMinorSchema } from "@/lib/schemas/common";
import { transferCreateSchema, transactionCreateSchema } from "@/lib/schemas/finance";

const UUID_A = "10000000-0000-4000-8000-000000000001";
const UUID_B = "10000000-0000-4000-8000-000000000002";

describe("money schemas", () => {
  it("accepts BIGINT values as decimal strings without precision loss", () => {
    expect(positiveMinorSchema.parse("9223372036854775807")).toBe("9223372036854775807");
    expect(signedMinorSchema.parse("-9223372036854775808")).toBe("-9223372036854775808");
  });

  it("rejects numbers, zero, decimals, and BIGINT overflow", () => {
    for (const value of [1, "0", "1.2", "9223372036854775808"]) {
      expect(positiveMinorSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("finance mutation schemas", () => {
  it("rejects transfers between the same account", () => {
    expect(transferCreateSchema.safeParse({
      sourceAccountId: UUID_A, destinationAccountId: UUID_A, amountMinor: "100",
    }).success).toBe(false);
  });

  it("rejects unknown mass-assignment fields", () => {
    const result = transactionCreateSchema.safeParse({
      accountId: UUID_A, categoryId: UUID_B, kind: "expense", amountMinor: "100",
      transactedAt: "2026-09-08T00:00:00.000Z", userId: UUID_B,
    });
    expect(result.success).toBe(false);
  });
});
