import type { Account, Budget, Category, Goal, RecurringTransaction, Transaction } from "./finance";
import type { EmissionFactor } from "./carbon";
import type { CurrencyCode } from "./money";

export type NotificationType = "budget" | "goal" | "carbon" | "recurring" | "system";

export interface Notification {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly createdAt: string;
  readonly read: boolean;
  readonly actionHref?: string;
}

export interface Settings {
  readonly locale: "id-ID";
  readonly currency: CurrencyCode;
  readonly theme: "light" | "dark" | "system";
  readonly monthlyStartDay: number;
  readonly carbonUnit: "kg" | "g";
  readonly notificationsEnabled: boolean;
  readonly compactNumbers: boolean;
}

export interface DemoState {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly accounts: readonly Account[];
  readonly categories: readonly Category[];
  readonly transactions: readonly Transaction[];
  readonly budgets: readonly Budget[];
  readonly goals: readonly Goal[];
  readonly recurringTransactions: readonly RecurringTransaction[];
  readonly emissionFactors: readonly EmissionFactor[];
  readonly notifications: readonly Notification[];
  readonly settings: Settings;
}

export interface TransactionFilters {
  readonly from?: string;
  readonly to?: string;
  readonly direction?: Transaction["direction"];
  readonly accountIds?: readonly string[];
  readonly categoryIds?: readonly string[];
  readonly paymentMethods?: readonly Transaction["paymentMethod"][];
  readonly search?: string;
  readonly tags?: readonly string[];
}
