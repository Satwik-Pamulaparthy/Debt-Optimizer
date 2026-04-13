'use client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Props {
  timeline: number[];
}

export default function LineChart({ timeline }: Props) {
  const data = timeline.map((balance, i) => ({
    month: i === 0 ? 'Now' : `Mo ${i}`,
    balance: Math.round(balance),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(data.length / 7)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
          width={38}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-bg-secondary)',
            border: '0.5px solid var(--color-border-strong)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--color-text-primary)',
          }}
          formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Balance']}
          labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 2 }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="url(#blueArea)"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
