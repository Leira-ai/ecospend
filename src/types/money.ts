export type CurrencyCode = "IDR" | "USD" | "EUR" | "SGD" | (string & {});

export interface Money {
  readonly amountMinor: bigint;
  readonly currency: CurrencyCode;
}

export interface Rate {
  readonly basisPoints: bigint;
}

export type MoneyParseResult =
  | { readonly ok: true; readonly value: Money }
  | { readonly ok: false; readonly error: string };
