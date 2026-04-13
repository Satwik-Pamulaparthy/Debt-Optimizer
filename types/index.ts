// ─── Account Types ────────────────────────────────────────────────────────────

export type AccountType = 'checking' | 'savings' | 'investment';
export type DebtType =
  | 'credit_card'
  | 'personal_loan'
  | 'student_loan'
  | 'auto_loan'
  | 'mortgage'
  | 'medical'
  | 'other';
export type Strategy = 'avalanche' | 'snowball';
export type GoalType = 'fast_payoff' | 'low_monthly' | 'balanced';

export interface BankAccount {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  lastUpdated: string;
  mask?: string; // last 4 digits
}

export interface Debt {
  id: string;
  name: string;
  institution: string;
  type: DebtType;
  balance: number;
  originalBalance: number;
  minimumPayment: number;
  apr: number;        // Annual Percentage Rate (e.g. 22.99)
  dueDate: number;    // Day of month 1–31
  lateFee: number;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
}

// ─── User & Profile ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  goal: GoalType;
  selectedStrategy: Strategy;
  onboardingComplete: boolean;
  createdAt: string;
  country: string;   // ISO 3166-1 alpha-2 (e.g. "US", "IN")
  currency: string;  // ISO 4217 currency code (e.g. "USD", "INR")
}

// ─── Algorithm Types ─────────────────────────────────────────────────────────

export interface MonthlyPaymentDetail {
  debtId: string;
  debtName: string;
  payment: number;
  principal: number;
  interest: number;
  newBalance: number;
  isMinimumOnly: boolean;
  isPaidOff: boolean;
  daysUntilDue: number;
  isUrgent: boolean;     // due within 7 days
}

export interface MonthSnapshot {
  month: number;           // 1-based month index
  date: string;            // ISO date of that month
  payments: MonthlyPaymentDetail[];
  totalPaid: number;
  totalInterest: number;
  totalPrincipal: number;
  remainingDebt: number;
  cumulativeInterest: number;
}

export interface PayoffPlan {
  strategy: Strategy;
  label: string;
  description: string;
  color: string;
  totalMonths: number;
  payoffDate: string;
  totalInterestPaid: number;
  totalAmountPaid: number;
  monthlySavingsVsMinimum: number;
  monthsSavedVsMinimum: number;
  interestSavedVsMinimum: number;
  schedule: MonthSnapshot[];
  debtPayoffOrder: { id: string; name: string; month: number }[];
  monthlyBudgetUsed: number;
  /** Running total remaining balance: index 0 = starting balance, index i = balance after month i */
  balanceTimeline: number[];
}

export interface StrategyComparison {
  avalanche: PayoffPlan;
  snowball: PayoffPlan;
  minimumOnly: PayoffPlan;
}

// ─── Insight & Recommendation Types ─────────────────────────────────────────

export type InsightSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface Insight {
  id: string;
  title: string;
  description: string;
  action?: string;
  severity: InsightSeverity;
  savingsAmount?: number;
  category: 'payment' | 'interest' | 'utilization' | 'budget' | 'milestone';
}

export interface ScenarioResult {
  extraPayment: number;
  newTotalMonths: number;
  monthsSaved: number;
  interestSaved: number;
  newPayoffDate: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationType = 'due_soon' | 'due_today' | 'overdue' | 'milestone' | 'tip';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  debtId?: string;
  read: boolean;
  createdAt: string;
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  user: UserProfile | null;
  bankAccounts: BankAccount[];
  debts: Debt[];
  notifications: Notification[];
  theme: 'dark' | 'light';
}
