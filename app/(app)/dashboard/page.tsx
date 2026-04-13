'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TrendingDown, Plus } from 'lucide-react';
import { useStore, selectAvailableBudget } from '@/lib/store';
import { simulatePayoff } from '@/lib/algorithm/engine';
import { totalMinimumPayments } from '@/lib/algorithm/calculator';
import { formatCurrency, formatDuration } from '@/lib/utils';
import type { Strategy, Debt } from '@/types';

const LineChart = dynamic(() => import('@/components/dashboard/LineChart'), { ssr: false });

// ── Helpers ────────────────────────────────────────────────────────────────
function dueBadge(dueDay: number) {
  // days until next occurrence of dueDay
  const today   = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  const target  = thisMonth <= today ? nextMonth : thisMonth;
  const days    = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
  if (days <= 5)  return { cls: 'bg-red-500/10 text-red-400',    label: `Due in ${days}d` };
  if (days <= 12) return { cls: 'bg-amber-500/10 text-amber-400', label: `Due in ${days}d` };
  return               { cls: 'bg-blue-500/10 text-blue-400',   label: `Due in ${days}d` };
}

const RANK_STYLES = [
  { badge: 'bg-red-500/10 text-red-400',         accent: '#f87171' },
  { badge: 'bg-blue-500/10 text-blue-400',        accent: '#60a5fa' },
  { badge: 'bg-amber-500/10 text-amber-400',      accent: '#fbbf24' },
  { badge: 'bg-emerald-500/10 text-emerald-400',  accent: '#34d399' },
  { badge: 'bg-violet-500/10 text-violet-400',    accent: '#a78bfa' },
  { badge: 'bg-pink-500/10 text-pink-400',        accent: '#f472b6' },
];

function rankStyle(i: number) { return RANK_STYLES[i % RANK_STYLES.length]; }

function utilCls(pct: number) {
  if (pct < 40) return 'bg-emerald-400';
  if (pct < 70) return 'bg-amber-400';
  return 'bg-red-400';
}

const card: React.CSSProperties = {
  background:   'var(--color-bg-secondary)',
  border:       '0.5px solid var(--color-border)',
  borderRadius: 12,
};

type Tab = 'priority' | 'timeline' | 'suggestions' | 'accounts';

const AVALANCHE_NOTE = (d: Debt, rank: number) =>
  rank === 0 ? `Highest APR at ${d.apr}% — costs the most per dollar. Attack first.`
  : `${d.apr}% APR — pay minimums until higher-rate cards are cleared.`;

const SNOWBALL_NOTE = (d: Debt, rank: number) =>
  rank === 0 ? `Smallest balance — quickest win to build momentum.`
  : `Pay minimums until smaller balances are eliminated.`;

// ── Page ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const debts        = useStore(s => s.debts);
  const bankAccounts = useStore(s => s.bankAccounts);
  const user         = useStore(s => s.user);
  const budget       = useStore(selectAvailableBudget);

  const currency = user?.currency ?? 'USD';
  const fmt      = (n: number) => formatCurrency(n, currency);

  const activeDebts = debts.filter(d => d.isActive && d.balance > 0);
  const minPayments = useMemo(() => totalMinimumPayments(activeDebts), [activeDebts]);
  const totalDebt   = activeDebts.reduce((s, d) => s + d.balance, 0);
  const totalCash   = bankAccounts.reduce((s, a) => s + a.balance, 0);

  const [tab,      setTab]      = useState<Tab>('priority');
  const [strategy, setStrategy] = useState<Strategy>(user?.selectedStrategy ?? 'avalanche');
  const [extra,    setExtra]    = useState(0);

  // Total budget = monthly surplus (income - expenses) or at least minimums
  const totalBudget = Math.max(minPayments, budget) + extra;

  const result   = useMemo(
    () => activeDebts.length > 0 ? simulatePayoff(activeDebts, totalBudget, strategy) : null,
    [activeDebts, totalBudget, strategy],
  );
  const baseline = useMemo(
    () => activeDebts.length > 0 ? simulatePayoff(activeDebts, minPayments, strategy) : null,
    [activeDebts, minPayments, strategy],
  );

  const saved       = Math.max(0, (baseline?.totalInterestPaid ?? 0) - (result?.totalInterestPaid ?? 0));
  const monthlyInt  = activeDebts.reduce((s, d) => s + d.balance * (d.apr / 100 / 12), 0);

  const sortedDebts = useMemo(() => {
    if (strategy === 'snowball') return [...activeDebts].sort((a, b) => a.balance - b.balance);
    // avalanche: highest APR first
    return [...activeDebts].sort((a, b) => b.apr - a.apr);
  }, [activeDebts, strategy]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'priority',    label: 'Payment Priority' },
    { id: 'timeline',    label: 'Timeline' },
    { id: 'suggestions', label: 'AI Suggestions' },
    { id: 'accounts',    label: 'Accounts' },
  ];

  // ── Empty state ──────────────────────────────────────────────────────────
  if (activeDebts.length === 0) {
    return (
      <div style={{ minHeight: '100vh', color: 'var(--color-text-primary)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <TrendingDown style={{ width: 30, height: 30, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
            No debts yet
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            Add your credit cards and loans to generate your personalised
            payoff plan, interest projections, and debt-free countdown.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/accounts" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10,
              background: '#6366f1', color: '#fff',
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
            }}>
              <Plus style={{ width: 14, height: 14 }} /> Add Debt Manually
            </Link>
            <Link href="/accounts?tab=accounts" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10,
              background: 'var(--color-bg-secondary)',
              border: '0.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
            }}>
              Connect via Plaid
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', color: 'var(--color-text-primary)' }}>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* ── Summary metrics ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, padding: '16px 0 14px' }}
          className="sm:grid-cols-4">
          {[
            { label: 'Total Debt',         value: fmt(totalDebt),   sub: `${activeDebts.length} active` },
            { label: 'Min Due This Month', value: fmt(minPayments), sub: 'across all debts' },
            { label: 'Available Cash',     value: fmt(totalCash),   sub: `${bankAccounts.length} accounts` },
            { label: 'Interest / Month',   value: fmt(Math.round(monthlyInt)), sub: result ? `free in ${formatDuration(result.totalMonths)}` : '—' },
          ].map(m => (
            <div key={m.label} style={{ ...card, padding: '13px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.15 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 3,
          background: 'var(--color-bg-tertiary)',
          borderRadius: 12, padding: 3, marginBottom: 14,
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '7px 4px',
              border:      tab === t.id ? '0.5px solid var(--color-border-strong)' : 'none',
              borderRadius: 8,
              background:  tab === t.id ? 'var(--color-surface)' : 'transparent',
              color:       tab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontSize: 12, fontWeight: tab === t.id ? 500 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ════════════════ Tab 1 — Priority ═══════════════════════════ */}
        {tab === 'priority' && (
          <div>
            {/* Strategy toggle */}
            <div style={{
              display: 'flex', gap: 3,
              background: 'var(--color-bg-tertiary)',
              borderRadius: 8, padding: 3, width: 'fit-content', marginBottom: 14,
            }}>
              {(['avalanche', 'snowball'] as Strategy[]).map(s => (
                <button key={s} onClick={() => setStrategy(s)} style={{
                  padding: '6px 14px',
                  border:       strategy === s ? '0.5px solid var(--color-border-strong)' : 'none',
                  borderRadius: 6,
                  background:   strategy === s ? 'var(--color-surface)' : 'transparent',
                  color:        strategy === s ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: 12, fontWeight: strategy === s ? 500 : 400,
                  cursor: 'pointer', transition: 'all 0.12s', textTransform: 'capitalize',
                }}>{s}</button>
              ))}
            </div>

            <div style={{
              fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8,
            }}>Pay in this order</div>

            {result && sortedDebts.length > 0
              ? sortedDebts.map((d: Debt, i: number) => {
                  const rs   = rankStyle(i);
                  const util = d.creditLimit ? Math.round(d.balance / d.creditLimit * 100) : null;
                  const due  = dueBadge(d.dueDate);
                  const note = strategy === 'snowball' ? SNOWBALL_NOTE(d, i) : AVALANCHE_NOTE(d, i);
                  return (
                    <div key={d.id} style={{ ...card, padding: '13px 14px 15px', marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: rs.accent }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0,
                        }} className={rs.badge}>#{i + 1}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{d.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            <span>{d.apr}% APR</span>
                            <span>·</span>
                            <span>Min {fmt(d.minimumPayment)}</span>
                            {util !== null && <><span>·</span><span>{util}% util.</span></>}
                            <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 500 }} className={due.cls}>{due.label}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 17, fontWeight: 500 }}>{fmt(d.balance)}</span>
                        {d.creditLimit && (
                          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>of {fmt(d.creditLimit)} limit</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 7, fontStyle: 'italic' }}>{note}</div>
                    </div>
                  );
                })
              : null
            }

            {/* Slider */}
            <div style={{ ...card, padding: '15px 16px', marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 11 }}>
                <span>Extra monthly payment</span>
                <span style={{ fontSize: 18, fontWeight: 500, color: '#3b82f6' }}>{fmt(extra)}</span>
              </div>
              <input type="range" min={0} max={1200} step={50} value={extra}
                onChange={e => setExtra(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                <span>{fmt(0)}</span><span>{fmt(1200)}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 13 }}>
                {[
                  { label: 'Debt-free in', value: result ? formatDuration(result.totalMonths) : '—', color: 'var(--color-text-primary)' },
                  { label: 'Interest saved vs minimums', value: fmt(saved), color: '#10b981' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: 'var(--color-bg-tertiary)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 17, fontWeight: 500, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ Tab 2 — Timeline ═══════════════════════════ */}
        {tab === 'timeline' && result && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
              Months to payoff
            </div>
            {sortedDebts.map((d: Debt, i: number) => {
              const mo  = result.debtPayoffOrder.find(o => o.id === d.id)?.month ?? result.totalMonths;
              const pct = result.totalMonths > 0 ? Math.round(mo / result.totalMonths * 100) : 100;
              const rs  = rankStyle(i);
              return (
                <div key={d.id} style={{ ...card, padding: '13px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>{d.name}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{formatDuration(mo)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: rs.accent, transition: 'width 0.25s ease' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ ...card, padding: '15px 16px', marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Running Balance Over Time</div>
              <LineChart timeline={result.balanceTimeline} />
            </div>
          </div>
        )}

        {/* ════════════════ Tab 3 — AI Suggestions ═════════════════════ */}
        {tab === 'suggestions' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
              Personalised recommendations
            </div>
            {buildSuggestions(activeDebts, fmt, result).map((s, i) => (
              <div key={i} style={{ ...card, padding: '13px 14px', marginBottom: 8, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 19, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════ Tab 4 — Accounts ═══════════════════════════ */}
        {tab === 'accounts' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
              Credit cards &amp; loans
            </div>
            {activeDebts.map(d => {
              const util = d.creditLimit ? Math.round(d.balance / d.creditLimit * 100) : null;
              const due  = dueBadge(d.dueDate);
              return (
                <div key={d.id} style={{ ...card, padding: '14px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        {d.institution} · {d.apr}% APR
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 500 }}>{fmt(d.balance)}</div>
                      {d.creditLimit && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>of {fmt(d.creditLimit)}</div>}
                    </div>
                  </div>
                  {util !== null && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        <span>Utilization</span><span>{util}%</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden', marginBottom: 9 }}>
                        <div style={{ height: '100%', width: `${util}%`, borderRadius: 3 }} className={utilCls(util)} />
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <span>Min due: {fmt(d.minimumPayment)}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 500 }} className={due.cls}>{due.label}</span>
                  </div>
                </div>
              );
            })}

            {bankAccounts.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8, marginTop: 16 }}>
                  Bank accounts
                </div>
                {bankAccounts.map(a => (
                  <div key={a.id} style={{ ...card, padding: '14px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{a.institution} · {a.type}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 500, color: '#10b981' }}>{fmt(a.balance)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Dynamic AI suggestions from real data ──────────────────────────────────
function buildSuggestions(
  debts: Debt[],
  fmt: (n: number) => string,
  result: ReturnType<typeof simulatePayoff> | null,
) {
  const suggestions = [];

  // Highest APR card
  const highApr = [...debts].sort((a, b) => b.apr - a.apr)[0];
  if (highApr) {
    const monthlyCost = Math.round(highApr.balance * (highApr.apr / 100 / 12));
    suggestions.push({
      icon:  '🔥',
      title: `Pay ${highApr.name} first — ${highApr.apr}% APR costs ${fmt(monthlyCost)}/month`,
      body:  `At ${highApr.apr}% APR, every $100 owed costs $${(highApr.apr / 1200).toFixed(2)}/month in interest. Avalanche strategy targets this first and saves the most money.`,
    });
  }

  // Due soon
  const today = new Date();
  const dueSoon = debts
    .map(d => {
      const t = new Date(today.getFullYear(), today.getMonth(), d.dueDate);
      if (t <= today) t.setMonth(t.getMonth() + 1);
      const days = Math.ceil((t.getTime() - today.getTime()) / 86_400_000);
      return { ...d, daysUntil: days };
    })
    .filter(d => d.daysUntil <= 10)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  for (const d of dueSoon.slice(0, 2)) {
    suggestions.push({
      icon:  '⏰',
      title: `${d.name} due in ${d.daysUntil} days — pay at least ${fmt(d.minimumPayment)}`,
      body:  `Missing this payment triggers a ${d.lateFee > 0 ? fmt(d.lateFee) + ' late fee and potential' : ''} penalty APR. Pay now to stay protected.`,
    });
  }

  // High utilization
  const highUtil = debts.filter(d => d.creditLimit && d.balance / d.creditLimit > 0.5);
  for (const d of highUtil.slice(0, 1)) {
    const util = Math.round(d.balance / d.creditLimit! * 100);
    suggestions.push({
      icon:  '📊',
      title: `${d.name} utilization is ${util}% — paying to under 30% could add 20–40 credit score points`,
      body:  `Lenders consider above 30% high-risk. Target ${fmt(d.creditLimit! * 0.3)} balance to hit the 30% threshold.`,
    });
  }

  // Interest savings
  if (result && result.interestSavedVsMinimum > 100) {
    suggestions.push({
      icon:  '💡',
      title: `Your current plan saves ${fmt(Math.round(result.interestSavedVsMinimum))} in interest vs. paying minimums`,
      body:  `Staying consistent with extra payments gets you debt-free ${result.monthsSavedVsMinimum} months sooner than paying minimums only.`,
    });
  }

  // Autopay
  suggestions.push({
    icon:  '⚡',
    title: 'Set up autopay on all cards for minimums to avoid late fees',
    body:  'A single missed payment can trigger a $30–40 late fee and penalty APR. Autopay for minimums protects you while you make manual extra payments on top.',
  });

  return suggestions;
}
