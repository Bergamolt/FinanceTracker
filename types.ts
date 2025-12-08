export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  UAH = 'UAH',
  RUB = 'RUB',
  GBP = 'GBP'
}

export interface Debt {
  id: string;
  title: string;
  source: string; // e.g. "Credit Card", "Friend"
  totalAmount: number;
  remainingAmount: number;
  currency: Currency;
  isInstallment: boolean;
  totalInstallments?: number;
  paidInstallments?: number;
  monthlyPayment?: number;
  date: string;
}

export interface Expense {
  id: string;
  title: string; // e.g., "Rent"
  amount: number;
  currency: Currency;
  frequency: 'One-time' | 'Monthly' | 'Weekly' | 'Yearly';
  category: string;
  date: string;
  dayOfMonth?: number;
  isPaid?: boolean; // New field: true if money left the wallet, false if planned
}

export interface Asset {
  id: string;
  title: string; // e.g., "Salary", "Cash Stash"
  amount: number;
  currency: Currency;
  type: 'Income' | 'Balance';
  isReceived?: boolean; // true if money is in hand, false if projected
  autoCredit?: boolean; // New field: if true, automatically set isReceived=true when date arrives
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  deadline?: string;
  date: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'expense' | 'debt';
}

export interface FinancialState {
  debts: Debt[];
  expenses: Expense[];
  assets: Asset[];
  goals: Goal[];
  notifications: AppNotification[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}