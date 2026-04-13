/**
 * Debt Optimizer Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements Avalanche and Snowball payoff strategies.
 *
 * Strategy overview:
 *   Avalanche  → Pay minimums everywhere, put ALL extra on highest-APR debt.
 *                Mathematically optimal — minimizes total interest.
 *
 *   Snowball   → Pay minimums everywhere, put ALL extra on smallest-balance debt.
 *                Provides psychological "quick wins"; slightly more interest.
 *
 * Each month:
 *   1. Apply interest to every balance.
 *   2. Deduct minimum payment from budget.
 *   3. Sort remaining active debts by strategy priority.
 *   4. Allocate remaining budget to priority debt (or cascade to next).
 *   5. Record the snapshot for charting.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Debt, MonthSnapshot, MonthlyPaymentDetail, PayoffPlan, Strategy } from '@/types';
import {
  monthlyInterest,
  effectiveMinPayment,
  totalMinimumPayments,
  daysUntilDue,
  isUrgentDue,
  addMonths,
} from './calculator';

const MAX_MONTHS = 600; // 50-year safety cap

type DebtState = Debt & { currentBalance: number };

// ─── Priority comparators ────────────────────────────────────────────────────

const priorityAvalanche = (a: DebtState, b: DebtState): number => b.apr - a.apr;

const prioritySnowball = (a: DebtState, b: DebtState): number =>
  a.currentBalance - b.currentBalance;

function getPrioritizer(strategy: Strategy) {
  if (strategy === 'snowball') return prioritySnowball;
  return priorityAvalanche;
}

// ─── Core simulation ─────────────────────────────────────────────────────────

export function simulatePayoff(
  debts: Debt[],
  monthlyBudget: number,
  strategy: Strategy,
): PayoffPlan {
  if (debts.length === 0 || monthlyBudget <= 0) {
    return emptyPlan(strategy);
  }

  const compare = getPrioritizer(strategy);
  const schedule: MonthSnapshot[] = [];
  const debtPayoffOrder: PayoffPlan['debtPayoffOrder'] = [];

  // Initialize mutable state — never mutate original debts
  let states: DebtState[] = debts
    .filter(d => d.isActive && d.balance > 0)
    .map(d => ({ ...d, currentBalance: d.balance }));

  const startingBalance = states.reduce((s, d) => s + d.currentBalance, 0);
  const balanceTimeline: number[] = [startingBalance];

  let month = 0;
  let cumulativeInterest = 0;
  let cumulativePaid = 0;

  while (states.some(d => d.currentBalance > 0.01) && month < MAX_MONTHS) {
    month++;
    const payments: MonthlyPaymentDetail[] = [];
    let budgetLeft = monthlyBudget;

    // ── Step 1: Apply interest & collect minimum payments ──────────────────
    const interestMap: Record<string, number> = {};
    for (const d of states) {
      if (d.currentBalance <= 0) continue;
      interestMap[d.id] = monthlyInterest(d.currentBalance, d.apr);
    }

    // minPayMap tracks the minimum-only amount before any extra is allocated
    const minPayMap: Record<string, number> = {};
    const paymentMap: Record<string, number> = {};
    for (const d of states) {
      if (d.currentBalance <= 0) continue;
      const minPay = Math.min(
        effectiveMinPayment(d),
        d.currentBalance + interestMap[d.id],
      );
      minPayMap[d.id] = minPay;
      paymentMap[d.id] = minPay;
      budgetLeft -= minPay;
    }

    // ── Step 2: Allocate extra budget by strategy priority ─────────────────
    const activeSorted = states
      .filter(d => d.currentBalance > 0)
      .sort(compare);

    for (const d of activeSorted) {
      if (budgetLeft <= 0.01) break;
      const interest = interestMap[d.id] ?? 0;
      const maxPayable = d.currentBalance + interest - paymentMap[d.id];
      if (maxPayable > 0.01) {
        const extra = Math.min(budgetLeft, maxPayable);
        paymentMap[d.id] += extra;
        budgetLeft -= extra;
      }
    }

    // ── Step 3: Apply payments and record snapshot ─────────────────────────
    let monthTotalPaid = 0;
    let monthTotalInterest = 0;
    let monthTotalPrincipal = 0;

    for (const d of states) {
      if (d.currentBalance <= 0) {
        continue;
      }
      const interest = interestMap[d.id] ?? 0;
      const payment = paymentMap[d.id] ?? 0;
      const principal = Math.max(0, payment - interest);
      const newBalance = Math.max(0, d.currentBalance - principal);
      const wasPaidOff = d.currentBalance > 0.01 && newBalance <= 0.01;

      if (wasPaidOff) {
        debtPayoffOrder.push({ id: d.id, name: d.name, month });
      }

      monthTotalPaid += payment;
      monthTotalInterest += interest;
      monthTotalPrincipal += principal;
      d.currentBalance = newBalance;

      payments.push({
        debtId: d.id,
        debtName: d.name,
        payment,
        principal,
        interest,
        newBalance,
        isMinimumOnly: payment <= (minPayMap[d.id] ?? 0) + 0.01,
        isPaidOff: wasPaidOff,
        daysUntilDue: daysUntilDue(d.dueDate),
        isUrgent: isUrgentDue(d.dueDate),
      });
    }

    cumulativeInterest += monthTotalInterest;
    cumulativePaid += monthTotalPaid;

    const remainingDebt = states.reduce((s, d) => s + d.currentBalance, 0);
    balanceTimeline.push(remainingDebt);

    schedule.push({
      month,
      date: addMonths(month),
      payments,
      totalPaid: monthTotalPaid,
      totalInterest: monthTotalInterest,
      totalPrincipal: monthTotalPrincipal,
      remainingDebt,
      cumulativeInterest,
    });
  }

  const strategyMeta = STRATEGY_META[strategy];

  return {
    strategy,
    label: strategyMeta.label,
    description: strategyMeta.description,
    color: strategyMeta.color,
    totalMonths: month,
    payoffDate: addMonths(month),
    totalInterestPaid: cumulativeInterest,
    totalAmountPaid: cumulativePaid,
    monthlySavingsVsMinimum: 0, // filled in by compareStrategies
    monthsSavedVsMinimum: 0,
    interestSavedVsMinimum: 0,  // filled in by compareStrategies
    schedule,
    debtPayoffOrder,
    monthlyBudgetUsed: monthlyBudget,
    balanceTimeline,
  };
}

// ─── Compare all strategies ──────────────────────────────────────────────────

export function compareStrategies(
  debts: Debt[],
  monthlyBudget: number,
): Record<Strategy | 'minimumOnly', PayoffPlan> {
  const minBudget = totalMinimumPayments(debts);

  const avalanche = simulatePayoff(debts, monthlyBudget, 'avalanche');
  const snowball = simulatePayoff(debts, monthlyBudget, 'snowball');
  // Minimums-only baseline: only the sum of minimum payments, no extra
  const minimumOnly = simulatePayoff(debts, minBudget, 'avalanche');
  minimumOnly.strategy = 'avalanche'; // re-use type slot

  // Patch in relative savings vs minimum-only
  for (const plan of [avalanche, snowball]) {
    plan.interestSavedVsMinimum = minimumOnly.totalInterestPaid - plan.totalInterestPaid;
    plan.monthlySavingsVsMinimum = plan.interestSavedVsMinimum;
    plan.monthsSavedVsMinimum = minimumOnly.totalMonths - plan.totalMonths;
  }

  return { avalanche, snowball, minimumOnly };
}

// ─── Scenario simulation ─────────────────────────────────────────────────────

export function simulateExtraPayment(
  debts: Debt[],
  monthlyBudget: number,
  strategy: Strategy,
  extraPayment: number,
) {
  const base = simulatePayoff(debts, monthlyBudget, strategy);
  const extra = simulatePayoff(debts, monthlyBudget + extraPayment, strategy);

  return {
    extraPayment,
    newTotalMonths: extra.totalMonths,
    monthsSaved: base.totalMonths - extra.totalMonths,
    interestSaved: base.totalInterestPaid - extra.totalInterestPaid,
    newPayoffDate: extra.payoffDate,
  };
}

// ─── Insights generator ──────────────────────────────────────────────────────

export function generateInsights(
  debts: Debt[],
  monthlyIncome: number,
  monthlyExpenses: number,
  plan: PayoffPlan,
) {
  const insights = [];
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const dti = monthlyIncome > 0
    ? (totalMinimumPayments(debts) / monthlyIncome) * 100
    : 0;

  // High APR warning
  const highAprDebts = debts
    .filter(d => d.apr > 20)
    .sort((a, b) => b.apr - a.apr);

  if (highAprDebts.length > 0) {
    const topAPR = highAprDebts[0];
    const monthlyInterestCost = monthlyInterest(topAPR.balance, topAPR.apr);
    insights.push({
      id: 'high-apr',
      title: `${topAPR.name} is costing you $${Math.round(monthlyInterestCost)}/mo in interest`,
      description: `At ${topAPR.apr}% APR, paying this down first with the Avalanche method saves the most money overall.`,
      action: 'Switch to Avalanche strategy',
      severity: 'danger' as const,
      savingsAmount: plan.monthlySavingsVsMinimum,
      category: 'interest' as const,
    });
  }

  // Due date urgency
  const urgentDebts = debts.filter(d => isUrgentDue(d.dueDate, 7));
  for (const d of urgentDebts) {
    insights.push({
      id: `urgent-${d.id}`,
      title: `${d.name} is due in ${daysUntilDue(d.dueDate)} days`,
      description: `Minimum payment of $${d.minimumPayment} is due. Missing it triggers a $${d.lateFee} late fee.`,
      action: 'Pay now to avoid late fee',
      severity: daysUntilDue(d.dueDate) <= 3 ? 'danger' as const : 'warning' as const,
      savingsAmount: d.lateFee,
      category: 'payment' as const,
    });
  }

  // High utilization
  const highUtil = debts.filter(d => d.creditLimit && d.balance / d.creditLimit > 0.7);
  for (const d of highUtil) {
    const util = Math.round((d.balance / d.creditLimit!) * 100);
    insights.push({
      id: `util-${d.id}`,
      title: `${d.name} utilization is at ${util}%`,
      description: `High credit utilization (above 30%) hurts your credit score. Paying this down improves your score quickly.`,
      action: 'Pay down to below 30%',
      severity: util > 90 ? 'danger' as const : 'warning' as const,
      category: 'utilization' as const,
    });
  }

  // Debt-to-income ratio
  if (dti > 40) {
    insights.push({
      id: 'high-dti',
      title: `Your debt-to-income ratio is ${Math.round(dti)}%`,
      description: `Lenders consider above 43% high-risk. Reducing recurring debt payments will improve your financial flexibility.`,
      severity: dti > 50 ? 'danger' as const : 'warning' as const,
      category: 'budget' as const,
    });
  }

  // Payoff milestone
  if (plan.totalMonths < 12) {
    insights.push({
      id: 'close-payoff',
      title: `You could be debt-free in ${plan.totalMonths} months!`,
      description: `Staying consistent with this plan means you'll be completely debt-free by ${plan.payoffDate}.`,
      severity: 'success' as const,
      category: 'milestone' as const,
    });
  }

  // Low expenses efficiency
  const surplus = monthlyIncome - monthlyExpenses - totalMinimumPayments(debts);
  if (surplus > 200 && plan.totalMonths > 6) {
    insights.push({
      id: 'extra-payment-tip',
      title: `Putting $200 extra/month saves you ${Math.round((plan.monthsSavedVsMinimum * 0.3))} months`,
      description: `You have roughly $${Math.round(surplus)} surplus each month. Redirecting even part of it to debt pays off big.`,
      action: 'See scenario simulator',
      severity: 'info' as const,
      category: 'budget' as const,
    });
  }

  return insights;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyPlan(strategy: Strategy): PayoffPlan {
  const meta = STRATEGY_META[strategy];
  return {
    strategy,
    label: meta.label,
    description: meta.description,
    color: meta.color,
    totalMonths: 0,
    payoffDate: addMonths(0),
    totalInterestPaid: 0,
    totalAmountPaid: 0,
    monthlySavingsVsMinimum: 0,
    monthsSavedVsMinimum: 0,
    interestSavedVsMinimum: 0,
    schedule: [],
    debtPayoffOrder: [],
    monthlyBudgetUsed: 0,
    balanceTimeline: [],
  };
}

const STRATEGY_META: Record<Strategy, { label: string; description: string; color: string }> = {
  avalanche: {
    label: 'Avalanche',
    description: 'Pay minimums on all, put every extra dollar on the highest APR debt. Saves the most interest.',
    color: '#818cf8',
  },
  snowball: {
    label: 'Snowball',
    description: 'Pay minimums on all, then attack the smallest balance first. Provides fast psychological wins.',
    color: '#34d399',
  },
};
