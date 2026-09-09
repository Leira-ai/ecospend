export type TransactionType = "pemasukan" | "pengeluaran" | "transfer";

export type Transaction = {
  id: string;
  date: string;
  name: string;
  category: string;
  account: string;
  destinationAccount?: string;
  type: TransactionType;
  amount: number;
  carbonKg: number;
  notes?: string;
};

export type Budget = {
  id: string;
  category: string;
  limit: number;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  icon: "leaf" | "home" | "shield";
};

export type Account = {
  id: string;
  name: string;
  type: "Bank" | "Dompet digital" | "Tunai";
  balance: number;
  color: string;
};

export type Recurring = {
  id: string;
  name: string;
  category: string;
  amount: number;
  day: number;
  active: boolean;
};

export type Preferences = {
  displayName: string;
  currency: "IDR";
  theme: "system" | "light" | "dark";
  notifications: {
    budget: boolean;
    goals: boolean;
    weekly: boolean;
  };
  carbonMethod: "rata-rata" | "konservatif";
};

export type MerchantRule = {
  id: string;
  merchant: string;
  category: string;
};

export type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  status: "unread" | "read" | "archived";
};

export type DashboardState = {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  accounts: Account[];
  recurring: Recurring[];
  preferences: Preferences;
  rules: MerchantRule[];
};

export type DemoState = DashboardState;

export type DashboardStore = DashboardState & {
  isDemo: boolean;
  loading: boolean;
  error: string | null;
  notifications: DashboardNotification[];
  retry: () => Promise<void>;
  addTransaction: (item: Transaction) => Promise<void>;
  updateTransaction: (item: Transaction) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  importTransactions: (items: Transaction[]) => Promise<void>;
  bulkCategorize: (ids: string[], category: string) => Promise<void>;
  recalculateCarbon: () => Promise<void>;
  categorizeTransaction: (item: Transaction) => Transaction;
  saveBudget: (item: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  saveGoal: (item: Goal) => Promise<void>;
  contributeGoal: (id: string, amount: number) => Promise<void>;
  withdrawGoal: (id: string, amount: number) => Promise<void>;
  saveAccount: (item: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  saveRecurring: (item: Recurring) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  setPreferences: (item: Preferences) => Promise<void>;
  setRules: (items: MerchantRule[]) => Promise<void>;
  markNotificationsRead: (ids: string[]) => Promise<void>;
  resetData: () => Promise<void>;
};
