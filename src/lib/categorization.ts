export interface MerchantRule {
  readonly id: string;
  readonly categoryId: string;
  readonly merchantPatterns: readonly string[];
  readonly confidenceBasisPoints: bigint;
  readonly priority: number;
}

export interface CategorizationResult {
  readonly categoryId?: string;
  readonly confidenceBasisPoints: bigint;
  readonly matchedRuleId?: string;
  readonly normalizedMerchant: string;
}

export function normalizeMerchant(value: string): string {
  return value.normalize("NFKD").toLocaleLowerCase("id-ID")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\b(pt|cv|tbk|indonesia|id|official|store|merchant)\b/g, " ")
    .replace(/\b(inv|trx|ref)[-\s:#]*[a-z0-9-]+\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function categorizeMerchant(merchant: string, rules: readonly MerchantRule[]): CategorizationResult {
  const normalizedMerchant = normalizeMerchant(merchant);
  const candidates = rules.flatMap((rule) => rule.merchantPatterns
    .map(normalizeMerchant)
    .filter((pattern) => pattern.length >= 2 && normalizedMerchant.includes(pattern))
    .map((pattern) => ({ rule, length: pattern.length }))
  ).sort((left, right) =>
    right.rule.priority - left.rule.priority || right.length - left.length ||
    Number(right.rule.confidenceBasisPoints - left.rule.confidenceBasisPoints)
  );
  const match = candidates[0]?.rule;
  return match
    ? { categoryId: match.categoryId, confidenceBasisPoints: match.confidenceBasisPoints, matchedRuleId: match.id, normalizedMerchant }
    : { confidenceBasisPoints: 0n, normalizedMerchant };
}

export const DEFAULT_MERCHANT_RULES: readonly MerchantRule[] = [
  { id: "rule-grocery", categoryId: "groceries", merchantPatterns: ["superindo", "alfamart", "indomaret", "pasar"], confidenceBasisPoints: 9_200n, priority: 10 },
  { id: "rule-food", categoryId: "dining", merchantPatterns: ["warung", "bakso", "kopi", "resto"], confidenceBasisPoints: 8_800n, priority: 8 },
  { id: "rule-transport", categoryId: "transport", merchantPatterns: ["commuter line", "transjakarta", "grab", "gojek", "pertamina"], confidenceBasisPoints: 9_100n, priority: 10 },
  { id: "rule-utility", categoryId: "utilities", merchantPatterns: ["pln", "pdam", "telkom", "internet"], confidenceBasisPoints: 9_600n, priority: 10 },
  { id: "rule-shopping", categoryId: "shopping", merchantPatterns: ["tokopedia", "shopee", "mall"], confidenceBasisPoints: 8_700n, priority: 7 },
];
