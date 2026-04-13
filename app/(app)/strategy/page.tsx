'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap, TrendingDown, Clock, DollarSign, ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { useStore, selectAvailableBudget } from '@/lib/store';
import { compareStrategies } from '@/lib/algorithm/engine';
import { Strategy, PayoffPlan } from '@/types';
import { formatCurrency, formatDuration, formatDate } from '@/lib/utils';
import TopBar from '@/components/layout/TopBar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import DebtChart from '@/components/dashboard/DebtChart';

// ─── Kid-Friendly Explainers ────────────────────────────────────────���────────

const KID_EXPLAINERS: Record<Strategy, {
  title: string;
  emoji: string;
  analogy: string;
  howItWorks: string[];
  example: string;
  bestFor: string;
}> = {
  avalanche: {
    title: 'Avalanche — The Math Genius Strategy',
    emoji: '🏔️',
    analogy: 'Imagine you have three leaky buckets draining your water. The Avalanche strategy says: plug the biggest, fastest leak first — even if it\'s the biggest bucket. That way you stop losing the most water as quickly as possible.',
    howItWorks: [
      'List all your debts from highest interest rate to lowest.',
      'Pay the minimum on every debt each month.',
      'Throw any extra money at the debt with the highest interest rate.',
      'Once that debt is gone, attack the next highest rate.',
    ],
    example: 'You have a credit card at 25% and a student loan at 5%. You focus all extra payments on the credit card — because for every $100 you owe, the credit card steals $25 a year vs only $5 for the student loan.',
    bestFor: 'People who want to pay the least amount of money overall and don\'t mind if it takes a while to eliminate their first debt.',
  },
  snowball: {
    title: 'Snowball — The Quick Win Strategy',
    emoji: '⛄',
    analogy: 'Think of rolling a tiny snowball down a hill. It starts small, but as it rolls it picks up more snow and gets bigger and faster. This strategy pays off your smallest debts first — each win gives you momentum to tackle the next one!',
    howItWorks: [
      'List all your debts from smallest balance to largest.',
      'Pay the minimum on every debt each month.',
      'Throw any extra money at the debt with the smallest balance.',
      'Once it\'s gone, roll that payment into the next smallest debt.',
    ],
    example: 'You have a $400 medical bill, a $2,000 credit card, and a $10,000 car loan. You attack the $400 bill first. When it\'s gone (maybe in 2 months!) you feel amazing and attack the credit card with more motivation.',
    bestFor: 'People who need encouragement and quick wins to stay motivated. The psychological boost is real!',
  },
};

function KidExplainerModal({
  strategy,
  onClose,
}: {
  strategy: Strategy;
  onClose: () => void;
}) {
  const data = KID_EXPLAINERS[strategy];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{data.emoji}</span>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{data.title}</h2>
              <p className="text-indigo-400 text-xs mt-0.5">Explained like you're 10 years old</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/8 transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Analogy */}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1.5">The Analogy</p>
          <p className="text-slate-300 text-sm leading-relaxed">{data.analogy}</p>
        </div>

        {/* How it works */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2.5">How It Works</p>
          <ol className="space-y-2">
            {data.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="w-5 h-5 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-400 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Example */}
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1.5">Real Example</p>
          <p className="text-slate-300 text-sm leading-relaxed">{data.example}</p>
        </div>

        {/* Best for */}
        <div className="bg-white/[0.04] rounded-xl p-3">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Best For</p>
          <p className="text-slate-300 text-sm">{data.bestFor}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Strategy Config ──────────────────────────────────────────────────────────

const STRATEGY_CONFIG = {
  avalanche: {
    label: 'Avalanche',
    emoji: '🏔️',
    tagline: 'Mathematically optimal — saves the most interest',
    pros: ['Minimizes total interest paid', 'Fastest financial payoff overall', 'Best for high-APR debt'],
    cons: ['Slowest to eliminate individual balances', 'Can feel slow early on'],
    color: '#818cf8',
    gradient: 'from-indigo-500 to-violet-500',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/8',
  },
  snowball: {
    label: 'Snowball',
    emoji: '⛄',
    tagline: 'Quick wins — builds momentum and motivation',
    pros: ['Eliminates accounts fastest', 'Psychological wins keep you motivated', 'Simplifies payments over time'],
    cons: ['Pays slightly more interest overall', 'Ignores APR differences'],
    color: '#34d399',
    gradient: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/8',
  },
} as const;

function StrategyCard({
  strategy,
  plan,
  selected,
  onSelect,
  minimumOnlyMonths,
  fmt,
}: {
  strategy: Strategy;
  plan: PayoffPlan;
  selected: boolean;
  onSelect: () => void;
  minimumOnlyMonths: number;
  fmt: (n: number) => string;
}) {
  const cfg = STRATEGY_CONFIG[strategy];
  const [expanded, setExpanded] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {explainerOpen && (
          <KidExplainerModal strategy={strategy} onClose={() => setExplainerOpen(false)} />
        )}
      </AnimatePresence>
    <motion.div
      layout
      className={`rounded-2xl border p-5 transition-all cursor-pointer ${selected ? `${cfg.border} ${cfg.bg}` : 'border-white/[0.07] bg-white/[0.03] hover:border-white/10'}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-lg flex-shrink-0 shadow-lg`}>
            {cfg.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">{cfg.label}</h3>
              {selected && <Badge variant="purple" className="text-[10px]">Selected</Badge>}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{cfg.tagline}</p>
          </div>
        </div>
        {selected && <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.05]">
        {[
          { label: 'Payoff Time', value: formatDuration(plan.totalMonths), highlight: true },
          { label: 'Total Interest', value: fmt(plan.totalInterestPaid) },
          { label: 'vs Minimums', value: plan.monthlySavingsVsMinimum > 0 ? `Save ${fmt(plan.monthlySavingsVsMinimum)}` : '—', positive: plan.monthlySavingsVsMinimum > 0 },
        ].map(({ label, value, highlight, positive }) => (
          <div key={label} className="text-center">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-bold text-sm ${highlight ? 'text-white' : positive ? 'text-emerald-400' : 'text-slate-300'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Payoff date */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500">Debt-free by</span>
        <span className="text-white font-medium">{formatDate(plan.payoffDate)}</span>
      </div>

      {/* Bottom actions row */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less info' : 'Pros & cons'}
        </button>

        {/* Kid-friendly explainer trigger */}
        <button
          onClick={e => { e.stopPropagation(); setExplainerOpen(true); }}
          className="flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
        >
          <HelpCircle className="w-3 h-3" />
          Explain like I'm 10
        </button>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-emerald-400 font-medium mb-1.5">✓ Pros</p>
            <ul className="space-y-1">
              {cfg.pros.map(p => <li key={p} className="text-slate-400">{p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-red-400 font-medium mb-1.5">✗ Cons</p>
            <ul className="space-y-1">
              {cfg.cons.map(c => <li key={c} className="text-slate-400">{c}</li>)}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
    </>
  );
}

export default function StrategyPage() {
  const user = useStore(s => s.user);
  const debts = useStore(s => s.debts);
  const budget = useStore(selectAvailableBudget);
  const { setStrategy } = useStore();
  const currency = user?.currency ?? 'USD';
  const fmt = (amount: number): string => formatCurrency(amount, currency);
  const selectedStrategy = user?.selectedStrategy ?? 'avalanche';

  const activeDebts = debts.filter(d => d.isActive && d.balance > 0);

  const plans = useMemo(() => {
    if (activeDebts.length === 0 || budget <= 0) return null;
    return compareStrategies(activeDebts, budget);
  }, [debts, budget]);

  const comparisonData = plans
    ? [
        { name: 'Min Only', months: plans.minimumOnly.totalMonths, interest: Math.round(plans.minimumOnly.totalInterestPaid), fill: '#ef4444' },
        { name: 'Snowball', months: plans.snowball.totalMonths, interest: Math.round(plans.snowball.totalInterestPaid), fill: '#34d399' },
        { name: 'Avalanche', months: plans.avalanche.totalMonths, interest: Math.round(plans.avalanche.totalInterestPaid), fill: '#818cf8' },
      ]
    : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0f1117] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        <p className="text-white">{fmt(payload[0]?.value)} interest</p>
        <p className="text-slate-400">{payload[0]?.payload?.months} months</p>
      </div>
    );
  };

  if (!plans) {
    return (
      <div className="min-h-screen">
        <TopBar title="Strategy" subtitle="Choose your debt payoff strategy" />
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Zap className="w-12 h-12 text-slate-600 mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">No strategy yet</h2>
          <p className="text-slate-400 max-w-sm mb-6">Add your debts and set your monthly income to generate and compare payoff strategies.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => window.location.href = '/accounts'}>Add Debts</Button>
            <Button onClick={() => window.location.href = '/settings'}>Set Income</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Strategy" subtitle="Compare and choose your optimal payoff strategy" />

      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Header info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass rounded-xl px-4 py-2 text-sm">
            <span className="text-slate-400">Monthly budget: </span>
            <span className="text-white font-semibold">{fmt(budget)}</span>
          </div>
          <div className="glass rounded-xl px-4 py-2 text-sm">
            <span className="text-slate-400">Active debts: </span>
            <span className="text-white font-semibold">{activeDebts.length}</span>
          </div>
          <div className="glass rounded-xl px-4 py-2 text-sm">
            <span className="text-slate-400">Total balance: </span>
            <span className="text-red-400 font-semibold">{fmt(activeDebts.reduce((s, d) => s + d.balance, 0))}</span>
          </div>
        </div>

        {/* Strategy cards */}
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" /> Choose Your Strategy
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(['avalanche', 'snowball'] as Strategy[]).map(s => (
              <StrategyCard
                key={s}
                strategy={s}
                plan={plans[s]}
                selected={selectedStrategy === s}
                onSelect={() => setStrategy(s)}
                minimumOnlyMonths={plans.minimumOnly.totalMonths}
                fmt={fmt}
              />
            ))}
          </div>
        </div>

        {/* Comparison charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Interest comparison bar chart */}
          <Card className="p-5">
            <h3 className="text-white font-semibold mb-1">Total Interest Paid</h3>
            <p className="text-slate-400 text-xs mb-4">Lower is better — shows cost difference by strategy</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} width={52} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="interest" radius={[6, 6, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Balance over time chart */}
          <Card className="p-5">
            <h3 className="text-white font-semibold mb-1">Balance Over Time</h3>
            <p className="text-slate-400 text-xs mb-4">How fast each strategy brings your balance to zero</p>
            <DebtChart
              plans={{ avalanche: plans.avalanche, snowball: plans.snowball }}
              selected={selectedStrategy}
            />
          </Card>
        </div>

        {/* Full comparison table */}
        <Card className="p-5">
          <h3 className="text-white font-semibold mb-4">Full Strategy Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-slate-400 text-xs font-medium py-2 pr-4">Metric</th>
                  <th className="text-center text-red-400 text-xs font-medium py-2 px-3">Min Only</th>
                  <th className="text-center text-emerald-400 text-xs font-medium py-2 px-3">Snowball</th>
                  <th className="text-center text-indigo-400 text-xs font-medium py-2 px-3">Avalanche ⭐</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: 'Time to Debt-Free',
                    values: [
                      formatDuration(plans.minimumOnly.totalMonths),
                      formatDuration(plans.snowball.totalMonths),
                      formatDuration(plans.avalanche.totalMonths),
                    ],
                  },
                  {
                    label: 'Total Interest',
                    values: [
                      fmt(plans.minimumOnly.totalInterestPaid),
                      fmt(plans.snowball.totalInterestPaid),
                      fmt(plans.avalanche.totalInterestPaid),
                    ],
                  },
                  {
                    label: 'Total Amount Paid',
                    values: [
                      fmt(plans.minimumOnly.totalAmountPaid),
                      fmt(plans.snowball.totalAmountPaid),
                      fmt(plans.avalanche.totalAmountPaid),
                    ],
                  },
                  {
                    label: 'Payoff Date',
                    values: [
                      formatDate(plans.minimumOnly.payoffDate),
                      formatDate(plans.snowball.payoffDate),
                      formatDate(plans.avalanche.payoffDate),
                    ],
                  },
                  {
                    label: 'Savings vs Min Only',
                    values: ['—',
                      fmt(plans.snowball.monthlySavingsVsMinimum),
                      fmt(plans.avalanche.monthlySavingsVsMinimum),
                    ],
                  },
                ].map((row, rowIndex) => (
                  <tr key={row.label} className="border-b border-white/[0.04]">
                    <td className="text-slate-400 text-xs py-3 pr-4">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className={`text-center py-3 px-3 text-xs font-medium ${i === 2 ? 'text-indigo-400' : i === 0 ? 'text-red-400' : 'text-white'}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payoff order for selected strategy */}
        <Card className="p-5">
          <h3 className="text-white font-semibold mb-1">
            Debt Payoff Order — {STRATEGY_CONFIG[selectedStrategy].label}
          </h3>
          <p className="text-slate-400 text-xs mb-4">The order in which your debts will be paid off with the selected strategy</p>
          <div className="space-y-2">
            {plans[selectedStrategy].debtPayoffOrder.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-white text-sm flex-1">{item.name}</span>
                <span className="text-slate-400 text-xs">Month {item.month}</span>
                <Badge variant="success" className="text-[10px]">Paid off</Badge>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
