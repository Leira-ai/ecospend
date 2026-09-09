import { describe, expect, it } from "vitest";
import { formatMoney, money, multiplyRatio, parseMoney, ratioToRate, sumMoney } from "../money";

describe("money", () => {
  it("parses IDR grouping without floating point arithmetic", () => {
    expect(parseMoney("Rp1.234.567", "IDR")).toEqual({ ok: true, value: money(1_234_567n, "IDR") });
  });

  it("parses currencies with fractional minor units", () => {
    expect(parseMoney("1.234,56", "EUR")).toEqual({ ok: true, value: money(123_456n, "EUR") });
    expect(parseMoney("1,234.56", "USD")).toEqual({ ok: true, value: money(123_456n, "USD") });
  });

  it("formats bigint values larger than Number safe integer", () => {
    expect(formatMoney(money(9_007_199_254_740_993n))).toBe("Rp9.007.199.254.740.993");
  });

  it("rejects excess precision and currency mixing", () => {
    expect(parseMoney("1,234.567", "USD").ok).toBe(false);
    expect(() => sumMoney([money(1n, "IDR"), money(1n, "USD")])).toThrow();
  });

  it("rounds rational multiplication and percentages deterministically", () => {
    expect(multiplyRatio(money(101n), 1n, 2n)).toEqual(money(51n));
    expect(ratioToRate(1n, 3n).basisPoints).toBe(3_333n);
  });
});
