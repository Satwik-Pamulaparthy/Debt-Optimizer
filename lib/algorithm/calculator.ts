/**
 * Core financial calculation utilities.
 * All math is isolated here so the strategy engine stays clean.
 */

import { Debt } from '@/types';

/** Monthly interest rate from APR */
export const monthlyRate = (apr: number): number => apr / 100 / 12;

/** Interest accrued for one month on a given balance */
export const monthlyInterest = (balance: number, apr: number): number =>
  balance * monthlyRate(apr);

/** Number of days until next occurrence of `dueDay` from today */
export const daysUntilDue = (dueDay: number): number => {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  const target = thisMonth <= today ? nextMonth : thisMonth;
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
};

/** True if a payment is due within `threshold` days (default 7) */
export const isUrgentDue = (dueDay: number, threshold = 7): boolean =>
  daysUntilDue(dueDay) <= threshold;

/** Credit utilization ratio 0–1 */
export const utilizationRatio = (debt: Debt): number =>
  debt.creditLimit ? debt.balance / debt.creditLimit : 0;

/** Minimum payable amount (balance + interest if less than minimum) */
export const effectiveMinPayment = (debt: Debt): number => {
  const interest = monthlyInterest(debt.balance, debt.apr);
  return Math.min(debt.minimumPayment, debt.balance + interest);
};

/** Total minimum payments across all debts */
export const totalMinimumPayments = (debts: Debt[]): number =>
  debts.reduce((sum, d) => sum + effectiveMinPayment(d), 0);

/** Total outstanding balance */
export const totalBalance = (debts: Debt[]): number =>
  debts.reduce((sum, d) => sum + d.balance, 0);

/** Total available cash from bank accounts */
export const totalAvailableCash = (balances: number[]): number =>
  balances.reduce((a, b) => a + b, 0);

/**
 * Estimate months to pay off a single debt at a fixed payment.
 * Returns Infinity if payment <= monthly interest.
 */
export const monthsToPayoff = (balance: number, apr: number, monthlyPayment: number): number => {
  const r = monthlyRate(apr);
  if (r === 0) return monthlyPayment > 0 ? Math.ceil(balance / monthlyPayment) : Infinity;
  const interest = balance * r;
  if (monthlyPayment <= interest) return Infinity;
  return Math.ceil(
    -Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r)
  );
};

/**
 * Add N months to today and return an ISO date string.
 */
export const addMonths = (months: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

/** Format as USD */
export const usd = (v: number, fractionDigits = 0): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fractionDigits,
  }).format(v);

/** Format months as "X yr Y mo" */
export const formatDuration = (months: number): string => {
  if (months <= 0) return '0 mo';
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y} yr` : `${y} yr ${m} mo`;
};

/** Short date label e.g. "Mar 2026" */
export const monthLabel = (isoDate: string): string => {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
