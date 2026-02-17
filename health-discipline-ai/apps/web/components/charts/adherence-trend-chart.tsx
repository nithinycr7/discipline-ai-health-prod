'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { date: string; percentage: number; taken: number; total: number }[];
}

export function AdherenceTrendChart({ data }: Props) {
  // Filter out days with no data (percentage === -1)
  const chartData = data
    .filter((d) => d.percentage >= 0)
    .map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No adherence data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            fontSize: 13,
          }}
          formatter={(value: number, _: string, entry: any) => [
            `${value}% (${entry.payload.taken}/${entry.payload.total})`,
            'Adherence',
          ]}
          labelFormatter={(label) => label}
        />
        <Area
          type="monotone"
          dataKey="percentage"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#adherenceGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
