'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb, TrendingDown, AlertTriangle, CheckCircle,
  Info, Zap, DollarSign, Calculator,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useStore, selectAvailableBudget } from '@/lib/store';
import { simulatePayoff, generateInsights, simulateExtraPayment } from '@/lib/algorithm/engine';
import { Insight } from '@/types';
import { formatCurrency, formatDuration, formatDate } from '@/lib/utils';
import { getCurrencyForCountry } from '@/lib/currencies';
import TopBar from '@/components/layout/TopBar';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

// ─── Insight severity config ──────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  danger:  { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/20',    badge: 'danger' as const },
  warning: { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  badge: 'warning' as const },
  success: { icon: CheckCircle,   color: 'text-emerald-400',bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',badge: 'success' as const },
  info:    { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/20',   badge: 'info' as const },
};

function InsightCard({ insight, fmt }: { insight: Insight; fmt: (n: number) => string }) {
  const cfg = SEVERITY_CONFIG[insight.severity];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className={`font-semibold text-sm ${cfg.color}`}>{insight.title}</h4>
            {insight.savingsAmount && insight.savingsAmount > 0 && (
              <Badge variant="success" className="text-[10px]">
                Save {fmt(insight.savingsAmount)}
              </Badge>
            )}
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{insight.description}</p>
          {insight.action && (
            <button className={`mt-2 text-xs font-medium ${cfg.color} hover:opacity-80 transition-opacity flex items-center gap-1`}>
              → {insight.action}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Scenario simulator ───────────────────────────────────────────────────────
function ScenarioSimulator({
  debts,
  budget,
  strategy,
  basePlan,
  fmt,
  sym,
}: {
  debts: any[];
  budget: number;
  strategy: any;
  basePlan: any;
  fmt: (n: number) => string;
  sym: string;
}) {
  const [extraPayment, setExtraPayment] = useState(100);

  const scenario = useMemo(() => {
    if (!basePlan || debts.length === 0) return null;
    return simulateExtraPayment(debts, budget, strategy, extraPayment);
  }, [debts, budget, strategy, extraPayment, basePlan]);

  const chartData = useMemo(() => {
    const base = basePlan;
    const extra = scenario ? simulatePayoff(debts, budget + extraPayment, strategy) : null;
    const maxMonths = Math.min(60, base?.totalMonths ?? 0);
    const data = [];
    for (let i = 0; i <= maxMonths; i++) {
      data.push({
        month: i,
        base: base?.schedule[i - 1]?.remainingDebt ?? 0,
        extra: extra?.schedule[i - 1]?.remainingDebt ?? 0,
      });
    }
    return data;
  }, [basePlan, scenario, extraPayment]);

  const PRESETS = [50, 100, 200, 300, 500];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="w-4 h-4 text-violet-400" />
        <h3 className="text-white font-semibold">Scenario Simulator</h3>
      </div>
      <p className="text-slate-400 text-xs mb-5">"What if I pay extra each month?" — See the exact impact in real time.</p>

      {/* Extra payment input */}
      <div className="mb-4">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">Extra Monthly Payment</label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
            <input
              type="number"
              min={0}
              step={50}
              value={extraPayment}
              onChange={e => setExtraPayment(parseFloat(e.target.value) || 0)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white text-lg font-bold focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <span className="text-slate-400 text-sm">/ month extra</span>
        </div>

        {/* Preset buttons */}
        <div className="flex gap-2 mt-2">
          {PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => setExtraPayment(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${extraPayment === preset ? 'bg-violet-600 text-white' : 'glass text-slate-400 hover:text-white hover:bg-white/8'}`}
            >
              +${preset}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {scenario && (
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-bright rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs mb-1">Months Saved</p>
              <p className="text-white font-black text-3xl">{scenario.monthsSaved}</p>
              <p className="text-emerald-400 text-xs mt-0.5">months faster</p>
            </div>
            <div className="glass-bright rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs mb-1">Interest Saved</p>
              <p className="text-emerald-400 font-black text-3xl">{fmt(scenario.interestSaved)}</p>
              <p className="text-slate-500 text-xs mt-0.5">in total interest</p>
            </div>
          </div>
          <div className="flex items-center justify-between glass-bright rounded-xl px-4 py-3 text-sm">
            <span className="text-slate-400">New payoff date</span>
            <span className="text-white font-semibold">{formatDate(scenario.newPayoffDate)}</span>
          </div>
          <div className="flex items-center justify-between glass-bright rounded-xl px-4 py-3 text-sm">
            <span className="text-slate-400">New payoff time</span>
            <span className="text-white font-semibold">{formatDuration(scenario.newTotalMonths)}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div>
          <div className="flex gap-4 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-0.5 bg-slate-500 rounded" /> Current plan
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-0.5 bg-violet-400 rounded" /> With extra ${extraPayment}/mo
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} width={48} />
              <Tooltip
                contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: any) => [fmt(v), '']}
              />
              <Line type="monotone" dataKey="base" stroke="#475569" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="extra" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const user = useStore(s => s.user);
  const debts = useStore(s => s.debts);
  const budget = useStore(selectAvailableBudget);
  const strategy = user?.selectedStrategy ?? 'avalanche';
  const currency = user?.currency ?? 'USD';
  const fmt = (amount: number): string => formatCurrency(amount, currency);
  const sym = getCurrencyForCountry(user?.country ?? 'US').symbol;

  const activeDebts = debts.filter(d => d.isActive && d.balance > 0);

  const basePlan = useMemo(() => {
    if (activeDebts.length === 0 || budget <= 0) return null;
    return simulatePayoff(activeDebts, budget, strategy);
  }, [debts, budget, strategy]);

  const insights = useMemo(() => {
    if (!basePlan || !user) return [];
    return generateInsights(activeDebts, user.monthlyIncome, user.monthlyExpenses, basePlan);
  }, [basePlan, user, activeDebts]);

  const grouped = {
    danger: insights.filter(i => i.severity === 'danger'),
    warning: insights.filter(i => i.severity === 'warning'),
    success: insights.filter(i => i.severity === 'success'),
    info: insights.filter(i => i.severity === 'info'),
  };

  const AI_TIPS = [
    { icon: '💡', tip: `With ${fmt(budget)} monthly budget, the Avalanche strategy is mathematically optimal to save money — it attacks high-interest debt aggressively.` },
    { icon: '📉', tip: 'Credit card interest compounds daily. Even paying 3 days early on your highest-APR card can save $5–15 per month in interest.' },
    { icon: '🎯', tip: 'Focus extra payments on one debt at a time (your priority debt). Spreading extra payments across all debts is the least efficient approach.' },
    { icon: '⚡', tip: 'If you get a bonus or tax refund, putting 50% toward your highest-APR debt and 50% into emergency savings is a proven balanced approach.' },
    { icon: '📱', tip: 'Set up autopay for all minimum payments to eliminate late fee risk. Then manually pay extra to your priority debt each month.' },
  ];

  return (
    <div className="min-h-screen">
      <TopBar title="Insights" subtitle="Personalized recommendations powered by your data" />

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Alert insights */}
        {(grouped.danger.length > 0 || grouped.warning.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" /> Action Needed
            </h2>
            {[...grouped.danger, ...grouped.warning].map(insight => (
              <InsightCard key={insight.id} insight={insight} fmt={fmt} />
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personalized insights */}
          <div className="space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Personalized Insights
            </h2>
            {insights.length === 0 ? (
              <Card className="p-8 text-center">
                <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Add debts and income to get personalized insights.</p>
              </Card>
            ) : (
              <>
                {grouped.success.map(i => <InsightCard key={i.id} insight={i} fmt={fmt} />)}
                {grouped.info.map(i => <InsightCard key={i.id} insight={i} fmt={fmt} />)}
              </>
            )}

            {/* AI tips */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h3 className="text-white font-semibold">Financial Tips</h3>
                <Badge variant="purple" className="text-[10px]">AI</Badge>
              </div>
              <div className="space-y-3">
                {AI_TIPS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 glass rounded-xl">
                    <span className="text-lg flex-shrink-0">{tip.icon}</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{tip.tip}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Scenario simulator */}
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-violet-400" /> Scenario Simulator
            </h2>
            <ScenarioSimulator
              debts={activeDebts}
              budget={budget}
              strategy={strategy}
              basePlan={basePlan}
              fmt={fmt}
              sym={sym}
            />
          </div>
        </div>

        {/* Debt breakdown */}
        {activeDebts.length > 0 && (
          <Card className="p-5">
            <h3 className="text-white font-semibold mb-4">Interest Cost Analysis</h3>
            <div className="space-y-3">
              {[...activeDebts]
                .sort((a, b) => (b.balance * b.apr) - (a.balance * a.apr))
                .map(debt => {
                  const monthlyInterest = (debt.balance * debt.apr) / 100 / 12;
                  const annualInterest = monthlyInterest * 12;
                  const maxInterest = Math.max(...activeDebts.map(d => (d.balance * d.apr) / 100 / 12));

                  return (
                    <div key={debt.id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 truncate">{debt.name}</span>
                          <span className="text-orange-400 font-medium flex-shrink-0 ml-2">{fmt(monthlyInterest)}/mo</span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
                            style={{ width: `${maxInterest > 0 ? (monthlyInterest / maxInterest) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right text-xs flex-shrink-0 w-20">
                        <p className="text-slate-500">{debt.apr}% APR</p>
                        <p className="text-slate-600">{fmt(annualInterest)}/yr</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
