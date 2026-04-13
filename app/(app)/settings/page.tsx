'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, DollarSign, Target, Zap, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Strategy, GoalType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getCurrencyForCountry } from '@/lib/currencies';
import TopBar from '@/components/layout/TopBar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function SettingsPage() {
  const user = useStore(s => s.user);
  const { updateProfile, reset } = useStore();
  const fmt = (amount: number): string => formatCurrency(amount, user?.currency ?? 'USD');
  const sym = getCurrencyForCountry(user?.country ?? 'US').symbol;

  const [income, setIncome] = useState(user?.monthlyIncome?.toString() || '');
  const [expenses, setExpenses] = useState(user?.monthlyExpenses?.toString() || '');
  const [goal, setGoal] = useState<GoalType>(user?.goal || 'balanced');
  const [strategy, setStrategy] = useState<Strategy>(user?.selectedStrategy || 'avalanche');
  const [saved, setSaved] = useState(false);

  const surplus = (parseFloat(income) || 0) - (parseFloat(expenses) || 0);

  const handleSave = () => {
    updateProfile({
      monthlyIncome: parseFloat(income) || 0,
      monthlyExpenses: parseFloat(expenses) || 0,
      goal,
      selectedStrategy: strategy,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const GOALS: { value: GoalType; label: string; icon: string }[] = [
    { value: 'fast_payoff', label: 'Pay Off Fast', icon: '⚡' },
    { value: 'low_monthly', label: 'Low Monthly Burden', icon: '😌' },
    { value: 'balanced', label: 'Balanced', icon: '⚖️' },
  ];

  const STRATEGIES: { value: Strategy; label: string; icon: string }[] = [
    { value: 'avalanche', label: 'Avalanche', icon: '🏔️' },
    { value: 'snowball', label: 'Snowball', icon: '⛄' },
  ];

  return (
    <div className="min-h-screen">
      <TopBar title="Settings" subtitle="Manage your profile and preferences" />

      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Profile */}
        {user && (
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <User className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-semibold">Profile</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-black">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{user.name}</p>
                <p className="text-slate-400 text-sm">{user.email}</p>
                <Badge variant="success" className="mt-1">Account active</Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Financial settings */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-semibold">Financial Profile</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Monthly Take-Home Income', value: income, set: setIncome, color: 'focus:border-emerald-500' },
              { label: 'Monthly Living Expenses', value: expenses, set: setExpenses, color: 'focus:border-orange-500' },
            ].map(({ label, value, set, color }) => (
              <div key={label}>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={e => set(e.target.value)}
                    className={`w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white text-lg font-bold placeholder-slate-600 focus:outline-none ${color} transition-colors`}
                  />
                </div>
              </div>
            ))}

            {income && expenses && (
              <div className={`p-3 rounded-xl border text-sm ${surplus >= 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className={surplus >= 0 ? 'text-indigo-300' : 'text-red-400'}>
                  {surplus >= 0 ? `${fmt(surplus)}/month available for debt payoff` : `Budget deficit: ${fmt(-surplus)}/month`}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Goal */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-white font-semibold">Financial Goal</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${goal === g.value ? 'border-indigo-500/40 bg-indigo-500/10 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                <span className="text-xl">{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Strategy */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-4 h-4 text-violet-400" />
            <h3 className="text-white font-semibold">Default Strategy</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STRATEGIES.map(s => (
              <button
                key={s.value}
                onClick={() => setStrategy(s.value)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${strategy === s.value ? 'border-indigo-500/40 bg-indigo-500/10 text-white' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                <span className="text-xl">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Save */}
        <Button onClick={handleSave} className="w-full" size="lg">
          {saved ? <><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center"><Save className="w-2.5 h-2.5 text-white" /></motion.div> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </Button>

        {/* Danger zone */}
        <Card className="p-5 border-red-500/15">
          <h3 className="text-white font-semibold mb-4">Data Management</h3>
          <div className="space-y-3">
            <button
              onClick={() => { if (confirm('Reset all data? This cannot be undone.')) reset(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-left transition-all group"
            >
              <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
              <div>
                <p className="text-slate-400 group-hover:text-red-400 text-sm font-medium transition-colors">Reset All Data</p>
                <p className="text-slate-600 text-xs">Permanently delete all accounts, debts, and settings</p>
              </div>
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
}
