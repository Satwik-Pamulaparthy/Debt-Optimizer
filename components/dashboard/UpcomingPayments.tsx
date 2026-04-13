'use client';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Debt } from '@/types';
import { formatCurrency, daysUntilDue, getUrgencyConfig } from '@/lib/utils';
import { DEBT_TYPE_META } from '@/lib/mock-data';
import Badge from '@/components/ui/Badge';

interface Props {
  debts: Debt[];
}

export default function UpcomingPayments({ debts }: Props) {
  const sorted = [...debts]
    .filter(d => d.isActive && d.balance > 0)
    .map(d => ({ ...d, days: daysUntilDue(d.dueDate) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
        <p className="text-slate-400 text-sm">No upcoming payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {sorted.map((debt, i) => {
        const urgency = getUrgencyConfig(debt.days);
        const meta = DEBT_TYPE_META[debt.type] || DEBT_TYPE_META.other;
        return (
          <motion.div
            key={debt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-xl border ${urgency.border} ${urgency.bg} transition-all`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{meta.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{debt.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className={`w-3 h-3 ${urgency.color}`} />
                  <span className={`text-xs ${urgency.color}`}>{urgency.label}</span>
                  {debt.days <= 7 && debt.lateFee > 0 && (
                    <span className="text-xs text-slate-500">
                      · ${debt.lateFee} late fee risk
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white font-semibold text-sm">{formatCurrency(debt.minimumPayment)}</p>
              <p className="text-slate-500 text-[10px]">day {debt.dueDate}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
