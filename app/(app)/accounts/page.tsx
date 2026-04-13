'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TrendingDown, Building2 } from 'lucide-react';
import { useStore, selectTotalDebt, selectTotalCash } from '@/lib/store';
import { formatCurrency, daysUntilDue, getUrgencyConfig } from '@/lib/utils';
import { DEBT_TYPE_META, ACCOUNT_TYPE_META } from '@/lib/mock-data';
import TopBar from '@/components/layout/TopBar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import AddDebtModal from '@/components/features/AddDebtModal';
import AddAccountModal from '@/components/features/AddAccountModal';
import PlaidLinkButton from '@/components/features/PlaidLinkButton';
import type { Debt, BankAccount } from '@/types';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const debts = useStore(s => s.debts);
  const bankAccounts = useStore(s => s.bankAccounts);
  const user = useStore(s => s.user);
  const removeDebt = useStore(s => s.removeDebt);
  const removeBankAccount = useStore(s => s.removeBankAccount);
  const addDebt = useStore(s => s.addDebt);
  const addBankAccount = useStore(s => s.addBankAccount);
  const totalDebt = useStore(selectTotalDebt);
  const totalCash = useStore(selectTotalCash);
  const currency = user?.currency ?? 'USD';
  const fmt = (amount: number): string => formatCurrency(amount, currency);

  const handleDeleteDebt = (id: string) => {
    removeDebt(id);
    fetch(`/api/debts/${id}`, { method: 'DELETE', headers: { 'X-User-Id': user?.id ?? '' } }).catch(() => {});
  };

  const handlePlaidSuccess = (debts: Debt[], accounts: BankAccount[]) => {
    debts.forEach(d => addDebt(d));
    accounts.forEach(a => addBankAccount(a));
    setTab('accounts');
  };

  const handleDeleteAccount = (id: string) => {
    removeBankAccount(id);
    fetch(`/api/accounts/${id}`, { method: 'DELETE', headers: { 'X-User-Id': user?.id ?? '' } }).catch(() => {});
  };

  const [addDebtOpen, setAddDebtOpen] = useState(false);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [tab, setTab] = useState<'debts' | 'accounts'>('debts');

  const activeDebts = debts.filter(d => d.isActive);

  return (
    <div className="min-h-screen">
      <TopBar title="Accounts & Debts" subtitle="Manage all your financial accounts in one place" />
      <AddDebtModal open={addDebtOpen} onClose={() => setAddDebtOpen(false)} />
      <AddAccountModal open={addBankOpen} onClose={() => setAddBankOpen(false)} />

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Debt', value: fmt(totalDebt), color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Total Cash', value: fmt(totalCash), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Net Worth', value: fmt(totalCash - totalDebt), color: totalCash - totalDebt >= 0 ? 'text-emerald-400' : 'text-red-400', bg: 'bg-white/5 border-white/10' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.bg} text-center`}>
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 glass rounded-xl w-fit">
          {['debts', 'accounts'].map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t === 'debts' ? `Debts (${activeDebts.length})` : `Bank Accounts (${bankAccounts.length})`}
            </button>
          ))}
        </div>

        {/* Debts tab */}
        {tab === 'debts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Your Debts</h2>
              <Button onClick={() => setAddDebtOpen(true)} size="sm">
                <Plus className="w-3.5 h-3.5" /> Add Debt
              </Button>
            </div>

            {activeDebts.length === 0 ? (
              <Card className="p-12 text-center">
                <TrendingDown className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-1">No debts added yet</p>
                <p className="text-slate-600 text-sm mb-4">Add your credit cards, loans, and other debts to build your payoff plan.</p>
                <Button onClick={() => setAddDebtOpen(true)}><Plus className="w-4 h-4" /> Add Your First Debt</Button>
              </Card>
            ) : (
              <AnimatePresence>
                {activeDebts.map((debt, i) => {
                  const meta = DEBT_TYPE_META[debt.type] || DEBT_TYPE_META.other;
                  const days = daysUntilDue(debt.dueDate);
                  const urgency = getUrgencyConfig(days);
                  const util = debt.creditLimit ? (debt.balance / debt.creditLimit) * 100 : null;
                  const paidPct = debt.originalBalance > 0 ? ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100 : 0;

                  return (
                    <motion.div
                      key={debt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`p-5 ${days <= 7 ? 'border-orange-500/20' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                              style={{ background: `${meta.color}20` }}>
                              {meta.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-white font-semibold">{debt.name}</h3>
                                <Badge variant="default" className="text-[10px]">{meta.label}</Badge>
                                {days <= 7 && (
                                  <Badge variant="warning" dot className="text-[10px]">{urgency.label}</Badge>
                                )}
                              </div>
                              <p className="text-slate-500 text-xs mt-0.5">{debt.institution} · {debt.apr}% APR · Due day {debt.dueDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-red-400 font-bold text-lg">{fmt(debt.balance)}</p>
                              <p className="text-slate-500 text-xs">of {fmt(debt.originalBalance)}</p>
                            </div>
                            <button onClick={() => handleDeleteDebt(debt.id)}
                              className="w-8 h-8 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-3">
                          {[
                            { label: 'Min. Payment', value: fmt(debt.minimumPayment) },
                            { label: 'Monthly Interest', value: fmt((debt.balance * debt.apr) / 100 / 12) },
                            { label: 'Late Fee Risk', value: days <= 7 ? fmt(debt.lateFee) : '—', warn: days <= 7 && debt.lateFee > 0 },
                            { label: 'Paid Off', value: `${paidPct.toFixed(0)}%` },
                          ].map(({ label, value, warn }) => (
                            <div key={label}>
                              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
                              <p className={`font-semibold text-sm ${warn ? 'text-orange-400' : 'text-white'}`}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <ProgressBar
                            value={paidPct}
                            color={paidPct > 75 ? 'from-emerald-500 to-teal-500' : paidPct > 40 ? 'from-indigo-500 to-violet-500' : 'from-slate-600 to-slate-500'}
                            height="xs"
                          />
                        </div>

                        {/* Credit utilization */}
                        {util !== null && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Credit Utilization</span>
                              <span className={util > 70 ? 'text-red-400' : util > 30 ? 'text-amber-400' : 'text-emerald-400'}>
                                {util.toFixed(0)}% of {fmt(debt.creditLimit!)}
                              </span>
                            </div>
                            <ProgressBar
                              value={util}
                              color={util > 70 ? 'from-red-500 to-rose-500' : util > 30 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'}
                              height="xs"
                            />
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Bank accounts tab */}
        {tab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Bank Accounts</h2>
              <Button onClick={() => setAddBankOpen(true)} size="sm">
                <Plus className="w-3.5 h-3.5" /> Link Account
              </Button>
            </div>

            {/* Plaid connection */}
            <div className="p-4 rounded-xl bg-blue-500/8 border border-blue-500/20">
              <p className="text-white text-sm font-medium mb-1">Connect via Plaid</p>
              <p className="text-slate-400 text-xs mb-3">Securely sync balances and debt accounts from 12,000+ banks</p>
              <PlaidLinkButton onSuccess={handlePlaidSuccess} />
            </div>

            {bankAccounts.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-1">No bank accounts added</p>
                <p className="text-slate-600 text-sm mb-4">Add your checking and savings to calculate your available cash buffer.</p>
                <Button onClick={() => setAddBankOpen(true)}><Plus className="w-4 h-4" /> Add Account</Button>
              </Card>
            ) : (
              <AnimatePresence>
                {bankAccounts.map((account, i) => {
                  const meta = ACCOUNT_TYPE_META[account.type];
                  return (
                    <motion.div key={account.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                      <Card className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl">
                            {meta.icon}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{account.name}</h3>
                            <p className="text-slate-500 text-xs">{account.institution} · {meta.label}{account.mask ? ` ···${account.mask}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-emerald-400 font-bold text-xl">{fmt(account.balance)}</p>
                          <button onClick={() => handleDeleteAccount(account.id)}
                            className="w-8 h-8 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
