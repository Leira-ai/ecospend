import type { Money, Rate } from "./money";

export type AccountType = "cash" | "bank" | "e-wallet" | "investment";
export type TransactionDirection = "income" | "expense" | "transfer";
export type PaymentMethod = "cash" | "debit-card" | "credit-card" | "bank-transfer" | "qr" | "e-wallet";

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;
  readonly openingBalance: Money;
  readonly color: string;
  readonly archived: boolean;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly kind: Exclude<TransactionDirection, "transfer">;
  readonly color: string;
  readonly icon: string;
  readonly carbonActivityType?: string;
}

export interface CarbonActivity {
  readonly type: string;
  readonly quantityMinor: bigint;
  readonly quantityScale: bigint;
  readonly unit: string;
}

export interface Transaction {
  readonly id: string;
  readonly date: string;
  readonly direction: TransactionDirection;
  readonly amount: Money;
  readonly accountId: string;
  readonly transferAccountId?: string;
  readonly categoryId?: string;
  readonly merchant: string;
  readonly note?: string;
  readonly paymentMethod: PaymentMethod;
  readonly tags: readonly string[];
  readonly activity?: CarbonActivity;
  readonly recurringId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Budget {
  readonly id: string;
  readonly name: string;
  readonly categoryIds: readonly string[];
  readonly limit: Money;
  readonly month: string;
  readonly rollover: boolean;
}

export interface BudgetStatus {
  readonly budget: Budget;
  readonly spent: Money;
  readonly remaining: Money;
  readonly utilization: Rate;
  readonly exceeded: boolean;
}

export interface GoalContribution {
  readonly id: string;
  readonly date: string;
  readonly amount: Money;
  readonly accountId: string;
  readonly note?: string;
}

export interface Goal {
  readonly id: string;
  readonly name: string;
  readonly target: Money;
  readonly initialAmount: Money;
  readonly targetDate: string;
  readonly contributions: readonly GoalContribution[];
  readonly status: "active" | "completed" | "paused";
  readonly color: string;
}

export interface GoalProgress {
  readonly goal: Goal;
  readonly saved: Money;
  readonly remaining: Money;
  readonly progress: Rate;
  readonly completed: boolean;
}

export interface RecurringTransaction {
  readonly id: string;
  readonly name: string;
  readonly direction: Exclude<TransactionDirection, "transfer">;
  readonly amount: Money;
  readonly accountId: string;
  readonly categoryId: string;
  readonly merchant: string;
  readonly paymentMethod: PaymentMethod;
  readonly frequency: "weekly" | "monthly" | "yearly";
  readonly interval: number;
  readonly nextDate: string;
  readonly endDate?: string;
  readonly active: boolean;
}
