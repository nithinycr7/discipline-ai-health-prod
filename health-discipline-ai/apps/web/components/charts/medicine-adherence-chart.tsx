'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  data: { medicineId: string; name: string; taken: number; total: number; percentage: number }[];
}

function getBarColor(pct: number) {
  if (pct >= 90) return 'hsl(142 76% 36%)';
  if (pct >= 70) return 'hsl(48 96% 53%)';
  return 'hsl(0 84% 60%)';
}

export function MedicineAdherenceChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
        No medicine data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 12 ? d.name.slice(0, 11) + '...' : d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} tickLine={false} axisLine={false} width={90} />
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            fontSize: 13,
          }}
          formatter={(value: number, _: string, entry: any) => [
            `${value}% (${entry.payload.taken}/${entry.payload.total})`,
            entry.payload.name,
          ]}
        />
        <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={20}>
          {chartData.map((entry) => (
            <Cell key={entry.medicineId} fill={getBarColor(entry.percentage)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
