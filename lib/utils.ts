import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatCurrency(amount: number, currency = 'USD', fractionDigits = 0): string {
  // For JPY and KRW no decimal places make sense by default
  const digits = fractionDigits || (currency === 'JPY' || currency === 'KRW' ? 0 : 0);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatDuration(months: number): string {
  if (months <= 0) return '0 mo';
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0 ? `${y} yr` : `${y} yr ${m} mo`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function formatFullDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysUntilDue(dueDay: number): number {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  const target = thisMonth <= today ? nextMonth : thisMonth;
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

export function getUrgencyConfig(days: number) {
  if (days <= 3) return { label: `${days}d left`, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' };
  if (days <= 7) return { label: `${days}d left`, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' };
  if (days <= 14) return { label: `${days}d left`, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' };
  return { label: `${days}d left`, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
}
