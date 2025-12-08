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
  frequency: 'Monthly' | 'Weekly' | 'Yearly';
  category: string;
  date: string;
  dayOfMonth?: number;
}

export interface Asset {
  id: string;
  title: string; // e.g., "Salary", "Cash Stash"
  amount: number;
  currency: Currency;
  type: 'Income' | 'Balance';
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

export interface FinancialState {
  debts: Debt[];
  expenses: Expense[];
  assets: Asset[];
  goals: Goal[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}