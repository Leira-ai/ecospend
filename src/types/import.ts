import type { Transaction } from "./finance";

export interface ImportRowError {
  readonly row: number;
  readonly field: string;
  readonly message: string;
}

export interface ImportedTransaction {
  readonly transaction: Transaction;
  readonly fingerprint: string;
  readonly duplicate: boolean;
  readonly sourceRow: number;
}

export interface ImportResult {
  readonly transactions: readonly ImportedTransaction[];
  readonly errors: readonly ImportRowError[];
  readonly totalRows: number;
}

export type ImportRecord = Readonly<Record<string, unknown>>;
