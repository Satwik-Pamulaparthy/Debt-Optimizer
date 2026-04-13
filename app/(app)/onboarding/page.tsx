'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, TrendingDown, DollarSign, Target, Zap, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { GoalType, Strategy } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { getCurrencyForCountry } from '@/lib/currencies';
import Button from '@/components/ui/Button';

const STEPS = [
  { id: 'income', title: 'Your Income', subtitle: 'Tell us what you bring in each month' },
  { id: 'expenses', title: 'Monthly Expenses', subtitle: 'What are your fixed living costs?' },
  { id: 'goal', title: 'Your Goal', subtitle: 'What matters most to you?' },
  { id: 'strategy', title: 'Choose a Strategy', subtitle: "We'll recommend one based on your goal" },
  { id: 'done', title: "You're all set!", subtitle: 'Your personalized plan is ready' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateProfile } = useStore();
  const currency = user?.currency ?? 'USD';
  const currencySymbol = getCurrencyForCountry(user?.country ?? 'US').symbol;
  const fmt = (amount: number): string => formatCurrency(amount, currency);
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState(user?.monthlyIncome?.toString() || '');
  const [expenses, setExpenses] = useState(user?.monthlyExpenses?.toString() || '');
  const [goal, setGoal] = useState<GoalType>('balanced');
  const [strategy, setStrategy] = useState<Strategy>('avalanche');

  const next = () => {
    if (step === 0 && !income) return;
    if (step === 1 && !expenses) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };
  const back = () => step > 0 && setStep(s => s - 1);

  const finish = () => {
    updateProfile({
      monthlyIncome: parseFloat(income) || 0,
      monthlyExpenses: parseFloat(expenses) || 0,
      goal,
      selectedStrategy: strategy,
      onboardingComplete: true,
    });
    router.push('/dashboard');
  };

  const surplus = (parseFloat(income) || 0) - (parseFloat(expenses) || 0);

  const GOALS: { value: GoalType; label: string; desc: string; icon: string }[] = [
    { value: 'fast_payoff', label: 'Pay Off Fast', desc: 'Minimize time in debt — throw everything at it', icon: '⚡' },
    { value: 'low_monthly', label: 'Low Monthly Burden', desc: 'Keep payments manageable while still progressing', icon: '😌' },
    { value: 'balanced', label: 'Balanced Approach', desc: 'Save interest AND maintain a comfortable lifestyle', icon: '⚖️' },
  ];

  const STRATEGIES: { value: Strategy; label: string; desc: string; icon: string; recommended?: GoalType[] }[] = [
    { value: 'avalanche', label: 'Avalanche', desc: 'Mathematically saves the most money', icon: '🏔️', recommended: ['fast_payoff', 'balanced', 'low_monthly'] },
    { value: 'snowball', label: 'Snowball', desc: 'Quick wins to keep you motivated', icon: '⛄' },
  ];

  const recommendedStrategy = 'avalanche';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      <div className="w-full max-w-lg relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <TrendingDown className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-white">DebtOptimizer</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-500' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Step card */}
        <div className="glass-bright rounded-2xl p-8 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-6">
                <p className="text-indigo-400 text-xs font-medium uppercase tracking-widest mb-1">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h1 className="text-2xl font-bold text-white">{STEPS[step].title}</h1>
                <p className="text-slate-400 text-sm mt-1">{STEPS[step].subtitle}</p>
              </div>

              <div className="flex-1">
                {/* Step 0: Income */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">
                        Monthly Take-Home Income (after taxes)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-medium">{currencySymbol}</span>
                        <input
                          type="number"
                          placeholder="5,000"
                          value={income}
                          onChange={e => setIncome(e.target.value)}
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white text-2xl font-bold placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                          autoFocus
                        />
                      </div>
                      <p className="text-slate-500 text-xs mt-2">Include salary, freelance, side income — everything that hits your bank account monthly.</p>
                    </div>
                    {income && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-400 text-sm">
                          Great! {fmt(parseFloat(income))} per month gives us a solid foundation to work with.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1: Expenses */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">
                        Monthly Living Expenses
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-medium">{currencySymbol}</span>
                        <input
                          type="number"
                          placeholder="3,000"
                          value={expenses}
                          onChange={e => setExpenses(e.target.value)}
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white text-2xl font-bold placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                          autoFocus
                        />
                      </div>
                      <p className="text-slate-500 text-xs mt-2">Rent, food, utilities, transport — everything except debt payments.</p>
                    </div>
                    {expenses && income && (
                      <div className={`p-4 rounded-xl border ${surplus >= 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <p className={`text-sm font-medium ${surplus >= 0 ? 'text-indigo-300' : 'text-red-400'}`}>
                          {surplus >= 0
                            ? `${fmt(surplus)}/month available for debt payoff`
                            : `You're spending ${fmt(-surplus)} more than you earn — we'll help you find the best path forward`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Goal */}
                {step === 2 && (
                  <div className="space-y-3">
                    {GOALS.map(g => (
                      <button
                        key={g.value}
                        onClick={() => setGoal(g.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${goal === g.value ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                      >
                        <span className="text-2xl flex-shrink-0">{g.icon}</span>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">{g.label}</p>
                          <p className="text-slate-400 text-xs">{g.desc}</p>
                        </div>
                        {goal === g.value && <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3: Strategy */}
                {step === 3 && (
                  <div className="space-y-3">
                    {STRATEGIES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setStrategy(s.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${strategy === s.value ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                      >
                        <span className="text-2xl flex-shrink-0">{s.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm">{s.label}</p>
                            {s.recommended?.includes(goal) && (
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 rounded-full font-medium">Recommended</span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs">{s.desc}</p>
                        </div>
                        {strategy === s.value && <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 4: Done */}
                {step === 4 && (
                  <div className="text-center space-y-5 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">Perfect setup!</h3>
                      <p className="text-slate-400 text-sm">Your profile is configured. Head to the dashboard to see your payoff plan and add your debts.</p>
                    </div>
                    <div className="space-y-2 text-left">
                      {[
                        { label: 'Monthly income', value: fmt(parseFloat(income) || 0) },
                        { label: 'Monthly expenses', value: fmt(parseFloat(expenses) || 0) },
                        { label: 'Monthly for debt', value: fmt(Math.max(0, surplus)) },
                        { label: 'Goal', value: GOALS.find(g => g.value === goal)?.label || '' },
                        { label: 'Strategy', value: STRATEGIES.find(s => s.value === strategy)?.label || '' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between text-sm glass rounded-lg px-3 py-2">
                          <span className="text-slate-400">{row.label}</span>
                          <span className="text-white font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {step > 0 && step < 4 && (
                  <Button variant="secondary" onClick={back} className="flex-shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                {step < 4 ? (
                  <Button onClick={next} className="flex-1">
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={finish} className="flex-1" size="lg">
                    Go to Dashboard <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
