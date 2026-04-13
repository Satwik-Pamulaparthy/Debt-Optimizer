'use client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { PayoffPlan } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  plans: Partial<Record<string, PayoffPlan>>;
  selected: string;
}

const COLORS: Record<string, string> = {
  avalanche: '#818cf8',
  snowball: '#34d399',
};

const LABELS: Record<string, string> = {
  avalanche: 'Avalanche',
  snowball: 'Snowball',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">Month {label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-300">{LABELS[p.dataKey] || p.dataKey}:</span>
          <span className="text-white font-semibold ml-auto pl-2">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function DebtChart({ plans, selected }: Props) {
  const keys = Object.keys(plans).filter(k => plans[k]);
  if (keys.length === 0) return null;

  // Build chart data up to 60 months using balanceTimeline (index 0 = start)
  const maxMonths = Math.min(60, Math.max(...keys.map(k => plans[k]!.totalMonths)));
  const data = [];

  for (let i = 0; i <= maxMonths; i++) {
    const row: Record<string, number | string> = { month: i };
    for (const k of keys) {
      const plan = plans[k]!;
      row[k] = plan.balanceTimeline[i] ?? 0;
    }
    data.push(row);
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <defs>
          {keys.map(k => (
            <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[k]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS[k]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Months', position: 'insideBottom', offset: -2, fill: '#334155', fontSize: 10 }}
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} />
        {keys.map(k => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stroke={COLORS[k]}
            strokeWidth={k === selected ? 2.5 : 1.5}
            fill={`url(#grad-${k})`}
            strokeOpacity={k === selected ? 1 : 0.45}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
