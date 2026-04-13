'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Calendar, ChevronLeft, ChevronRight, DollarSign, TrendingDown } from 'lucide-react';
import { useStore, selectAvailableBudget } from '@/lib/store';
import { simulatePayoff } from '@/lib/algorithm/engine';
import { formatCurrency, formatDate, daysUntilDue, getUrgencyConfig } from '@/lib/utils';
import { DEBT_TYPE_META } from '@/lib/mock-data';
import TopBar from '@/components/layout/TopBar';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

export default function PaymentsPage() {
  const user = useStore(s => s.user);
  const debts = useStore(s => s.debts);
  const budget = useStore(selectAvailableBudget);
  const strategy = user?.selectedStrategy ?? 'avalanche';
  const currency = user?.currency ?? 'USD';
  const fmt = (amount: number): string => formatCurrency(amount, currency);
  const [monthOffset, setMonthOffset] = useState(0);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  const activeDebts = debts.filter(d => d.isActive && d.balance > 0);

  const plan = useMemo(() => {
    if (activeDebts.length === 0 || budget <= 0) return null;
    return simulatePayoff(activeDebts, budget, strategy);
  }, [debts, budget, strategy]);

  const currentSnapshot = plan?.schedule[monthOffset];
  const maxMonth = Math.min((plan?.totalMonths ?? 1) - 1, 23); // show up to 24 months

  const togglePaid = (debtId: string) => {
    setPaidIds(prev => {
      const next = new Set(prev);
      if (next.has(debtId)) next.delete(debtId);
      else next.add(debtId);
      return next;
    });
  };

  const nowLabel = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Payment Plan" subtitle="Your month-by-month debt payoff schedule" />

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {!plan ? (
          <Card className="p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h2 className="text-white font-bold text-xl mb-2">No payment plan yet</h2>
            <p className="text-slate-400 max-w-sm mx-auto">Add your debts and set your income to generate a month-by-month payment schedule.</p>
          </Card>
        ) : (
          <>
            {/* Month navigator */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMonthOffset(m => Math.max(0, m - 1))}
                  disabled={monthOffset === 0}
                  className="w-9 h-9 rounded-xl glass hover:bg-white/8 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <h2 className="text-white font-bold text-lg">{nowLabel()}</h2>
                  <p className="text-slate-400 text-xs">
                    Month {monthOffset + 1} of {plan.totalMonths}
                    {monthOffset === 0 ? ' — Current month' : ''}
                  </p>
                </div>

                <button
                  onClick={() => setMonthOffset(m => Math.min(maxMonth, m + 1))}
                  disabled={monthOffset >= maxMonth}
                  className="w-9 h-9 rounded-xl glass hover:bg-white/8 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Month slider */}
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={maxMonth}
                  value={monthOffset}
                  onChange={e => setMonthOffset(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(monthOffset / maxMonth) * 100}%, rgba(255,255,255,0.1) ${(monthOffset / maxMonth) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>Now</span>
                  <span>{formatDate(plan.payoffDate)}</span>
                </div>
              </div>
            </Card>

            {/* Month summary */}
            {currentSnapshot && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Payments', value: fmt(currentSnapshot.totalPaid), icon: DollarSign, color: 'text-white' },
                  { label: 'Interest Charged', value: fmt(currentSnapshot.totalInterest), icon: AlertTriangle, color: 'text-orange-400' },
                  { label: 'Principal Paid', value: fmt(currentSnapshot.totalPrincipal), icon: TrendingDown, color: 'text-emerald-400' },
                  { label: 'Remaining Debt', value: fmt(currentSnapshot.remainingDebt), icon: Clock, color: 'text-indigo-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label} className="p-4 text-center">
                    <p className="text-slate-400 text-xs mb-1.5">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Payment list */}
            {currentSnapshot && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Payment Breakdown</h3>
                  {monthOffset === 0 && (
                    <Badge variant="info" dot>
                      {paidIds.size}/{currentSnapshot.payments.length} marked paid
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {currentSnapshot.payments
                    .filter(p => p.payment > 0)
                    .sort((a, b) => b.payment - a.payment)
                    .map((payment, i) => {
                      const debt = activeDebts.find(d => d.id === payment.debtId);
                      const meta = debt ? DEBT_TYPE_META[debt.type] : DEBT_TYPE_META.other;
                      const isPaid = paidIds.has(payment.debtId);
                      const days = debt ? daysUntilDue(debt.dueDate) : 30;
                      const urgency = getUrgencyConfig(days);
                      const principalPct = payment.payment > 0 ? (payment.principal / payment.payment) * 100 : 0;

                      return (
                        <motion.div
                          key={payment.debtId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`rounded-xl border p-4 transition-all ${isPaid ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60' : payment.isUrgent ? 'border-orange-500/25 bg-orange-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">{meta.icon}</span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className={`font-semibold text-sm ${isPaid ? 'line-through text-slate-400' : 'text-white'}`}>
                                      {payment.debtName}
                                    </h4>
                                    {!payment.isMinimumOnly && !isPaid && (
                                      <Badge variant="purple" className="text-[10px]">Priority payment</Badge>
                                    )}
                                    {payment.isUrgent && !isPaid && (
                                      <Badge variant="warning" dot className="text-[10px]">{urgency.label}</Badge>
                                    )}
                                    {payment.isPaidOff && (
                                      <Badge variant="success" className="text-[10px]">🎉 Paid Off!</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span>{fmt(payment.interest)} interest</span>
                                    <span>·</span>
                                    <span>{fmt(payment.principal)} principal</span>
                                    {payment.newBalance > 0 && (
                                      <>
                                        <span>·</span>
                                        <span>{fmt(payment.newBalance)} remaining</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-xl font-bold ${isPaid ? 'text-emerald-400' : 'text-white'}`}>
                                    {fmt(payment.payment)}
                                  </p>
                                  {debt && <p className="text-slate-500 text-[10px]">due day {debt.dueDate}</p>}
                                </div>
                              </div>

                              {/* Principal vs interest bar */}
                              <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                                  <span>Principal {principalPct.toFixed(0)}%</span>
                                  <span>Interest {(100 - principalPct).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                                    style={{ width: `${principalPct}%` }}
                                  />
                                  <div className="h-full bg-orange-500/50 flex-1" />
                                </div>
                              </div>
                            </div>

                            {/* Mark paid (current month only) */}
                            {monthOffset === 0 && (
                              <button
                                onClick={() => togglePaid(payment.debtId)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isPaid ? 'bg-emerald-500 text-white' : 'glass hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400'}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>

                {/* Month total */}
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total for {nowLabel()}</p>
                    <p className="text-slate-500 text-xs">{fmt(currentSnapshot.totalInterest)} goes to interest</p>
                  </div>
                  <p className="text-white font-bold text-2xl">{fmt(currentSnapshot.totalPaid)}</p>
                </div>
              </Card>
            )}

            {/* 6-month overview */}
            <Card className="p-5">
              <h3 className="text-white font-semibold mb-4">6-Month Overview</h3>
              <div className="space-y-2">
                {plan.schedule.slice(monthOffset, monthOffset + 6).map((snap, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + monthOffset + i);
                  const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  const totalBalance = activeDebts.reduce((s, d) => s + d.balance, 0);
                  const pct = totalBalance > 0 ? ((totalBalance - snap.remainingDebt) / totalBalance) * 100 : 0;

                  return (
                    <div key={snap.month} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${i === 0 ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/3'}`}
                      onClick={() => setMonthOffset(monthOffset + i)}>
                      <span className="text-slate-400 text-xs w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1">
                        <ProgressBar
                          value={Math.min(100, (snap.remainingDebt > 0 ? (1 - snap.remainingDebt / totalBalance) : 1) * 100)}
                          color="from-indigo-500 to-violet-500"
                          height="xs"
                          animated={false}
                        />
                      </div>
                      <div className="text-right flex-shrink-0 w-28">
                        <p className="text-white text-xs font-semibold">{fmt(snap.totalPaid)}</p>
                        <p className="text-slate-500 text-[10px]">{fmt(snap.remainingDebt)} left</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
