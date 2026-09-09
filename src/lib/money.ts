import type { CurrencyCode, Money, MoneyParseResult, Rate } from "../types";

const CURRENCY_FRACTION_DIGITS: Readonly<Record<string, number>> = {
  IDR: 0, JPY: 0, KRW: 0, USD: 2, EUR: 2, SGD: 2,
};

export const currencyFractionDigits = (currency: CurrencyCode): number =>
  CURRENCY_FRACTION_DIGITS[currency] ?? 2;

export const money = (amountMinor: bigint, currency: CurrencyCode = "IDR"): Money => ({ amountMinor, currency });
const pow10 = (exponent: number): bigint => 10n ** BigInt(exponent);

export function parseMoney(input: string, currency: CurrencyCode = "IDR"): MoneyParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Nilai uang wajib diisi." };
  const normalized = trimmed.replace(/[\s_]/g, "");
  const digits = currencyFractionDigits(currency);
  const decimalSeparator = detectDecimalSeparator(normalized, digits);
  const cleaned = normalized.replace(/[^0-9,.-]/g, "");
  const sign = cleaned.startsWith("-") ? -1n : 1n;
  const unsigned = cleaned.replace(/^[+-]/, "");
  const parts = decimalSeparator ? unsigned.split(decimalSeparator) : [unsigned];
  if (parts.length > 2) return { ok: false, error: "Format uang tidak valid." };
  const wholeText = parts[0].replace(/[.,]/g, "") || "0";
  const fractionText = (parts[1] ?? "").replace(/[.,]/g, "");
  if (!/^\d+$/.test(wholeText) || (fractionText && !/^\d+$/.test(fractionText))) {
    return { ok: false, error: "Format uang tidak valid." };
  }
  if (fractionText.length > digits) {
    return { ok: false, error: `Maksimal ${digits} angka desimal untuk ${currency}.` };
  }
  const minor = BigInt(wholeText) * pow10(digits) + BigInt(fractionText.padEnd(digits, "0") || "0");
  return { ok: true, value: money(sign * minor, currency) };
}

function detectDecimalSeparator(value: string, digits: number): "." | "," | undefined {
  if (digits === 0) return undefined;
  const dot = value.lastIndexOf(".");
  const comma = value.lastIndexOf(",");
  if (dot >= 0 && comma >= 0) return dot > comma ? "." : ",";
  const separator = dot >= 0 ? "." : comma >= 0 ? "," : undefined;
  if (!separator) return undefined;
  const trailing = value.length - value.lastIndexOf(separator) - 1;
  return trailing > 0 && trailing <= digits ? separator : undefined;
}

export function formatMoney(value: Money, locale = "id-ID"): string {
  const digits = currencyFractionDigits(value.currency);
  const scale = pow10(digits);
  const absolute = value.amountMinor < 0n ? -value.amountMinor : value.amountMinor;
  const whole = absolute / scale;
  const fraction = absolute % scale;
  const sign = value.amountMinor < 0n ? "-" : "";
  const groupedWhole = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 })
    .formatToParts(whole).map((part) => part.value).join("");
  const fractionPart = digits ? `${decimalSymbol(locale)}${fraction.toString().padStart(digits, "0")}` : "";
  const currencySymbol = new Intl.NumberFormat(locale, {
    style: "currency", currency: value.currency, currencyDisplay: "symbol",
  }).formatToParts(0).find((part) => part.type === "currency")?.value ?? value.currency;
  const spaced = value.currency === "IDR" ? "" : " ";
  return `${sign}${currencySymbol}${spaced}${groupedWhole}${fractionPart}`;
}

function decimalSymbol(locale: string): string {
  return new Intl.NumberFormat(locale).formatToParts(1.1)
    .find((part) => part.type === "decimal")?.value ?? ",";
}

export function assertSameCurrency(values: readonly Money[]): CurrencyCode {
  const currency = values[0]?.currency ?? "IDR";
  if (!values.every((value) => value.currency === currency)) throw new Error("Mata uang tidak sama.");
  return currency;
}

export function sumMoney(values: readonly Money[], currency: CurrencyCode = "IDR"): Money {
  if (values.length === 0) return money(0n, currency);
  return money(values.reduce((total, value) => total + value.amountMinor, 0n), assertSameCurrency(values));
}

export function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency([left, right]);
  return money(left.amountMinor - right.amountMinor, left.currency);
}

export function multiplyRatio(value: Money, numerator: bigint, denominator: bigint): Money {
  if (denominator === 0n) throw new Error("Penyebut tidak boleh nol.");
  return money(divideRounded(value.amountMinor * numerator, denominator), value.currency);
}

export function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Penyebut tidak boleh nol.");
  const negative = (numerator < 0n) !== (denominator < 0n);
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const absoluteDenominator = denominator < 0n ? -denominator : denominator;
  const rounded = (absoluteNumerator + absoluteDenominator / 2n) / absoluteDenominator;
  return negative ? -rounded : rounded;
}

export const rate = (basisPoints: bigint): Rate => ({ basisPoints });

export function ratioToRate(numerator: bigint, denominator: bigint): Rate {
  return denominator === 0n ? rate(0n) : rate(divideRounded(numerator * 10_000n, denominator));
}

export function formatRate(value: Rate, locale = "id-ID", maximumFractionDigits = 1): string {
  const negative = value.basisPoints < 0n;
  const absolute = negative ? -value.basisPoints : value.basisPoints;
  const whole = absolute / 100n;
  const fraction = absolute % 100n;
  const decimal = fraction.toString().padStart(2, "0").slice(0, maximumFractionDigits);
  return `${negative ? "-" : ""}${whole.toString()}${decimal ? `${decimalSymbol(locale)}${decimal}` : ""}%`;
}
