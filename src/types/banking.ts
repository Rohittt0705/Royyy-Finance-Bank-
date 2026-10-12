export type AccountType = 'checking' | 'savings' | 'investment' | 'credit';

export interface CardDetails {
  cardNumber: string; // e.g. "4532 8920 1849 9021"
  cardholderName: string;
  expiryDate: string; // e.g. "08/29"
  cvv: string; // e.g. "842"
  isFrozen: boolean;
  contactlessEnabled: boolean;
  internationalEnabled: boolean;
  dailyAtmLimit: number;
  dailyOnlineLimit: number;
  pin: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber: string; // full 10-digit number
  routingNumber: string; // 9-digit routing
  balance: number;
  availableBalance: number;
  currency: string;
  apy?: number; // e.g. 4.85 for 4.85%
  creditLimit?: number;
  isFrozen: boolean;
  colorTheme: 'slate' | 'emerald' | 'amber' | 'indigo' | 'zinc';
  cardDetails?: CardDetails;
  createdDate: string;
}

export type TransactionCategory =
  | 'Housing'
  | 'Groceries'
  | 'Dining'
  | 'Transport'
  | 'Subscriptions'
  | 'Shopping'
  | 'Utilities'
  | 'Health'
  | 'Income'
  | 'Transfer'
  | 'Investment';

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number; // positive = debit (expense), negative = credit (income/deposit) or handled via type
  type: 'debit' | 'credit';
  category: TransactionCategory;
  status: 'settled' | 'pending';
  note?: string;
  referenceNumber: string;
  recipientAccount?: string;
}

export interface BudgetLimit {
  category: TransactionCategory;
  monthlyLimit: number;
}

export interface RecurringItem {
  id: string;
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  nextDueDate: string;
  category: TransactionCategory;
  accountId: string;
  active: boolean;
  logoLetter?: string;
}

export type AuditSeverity = 'info' | 'warning' | 'security';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  event: string;
  details: string;
  severity: AuditSeverity;
  ipAddress: string;
}

export interface Recipient {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  nickname?: string;
}

export interface SecurityState {
  isLocked: boolean;
  pinCode: string;
  privacyMode: boolean; // Hide balances with ••••••
  biometricEnabled: boolean;
  autoLockMinutes: number;
  lastActiveTimestamp: number;
  failedAttempts: number;
  auditLogs: AuditLogEntry[];
}
