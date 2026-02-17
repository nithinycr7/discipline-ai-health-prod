'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from 'recharts';

interface GlucoseProps {
  data: { date: string; value: number }[];
}

export function GlucoseChart({ data }: GlucoseProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
        No glucose readings yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  const maxVal = Math.max(...data.map((d) => d.value), 160);
  const minVal = Math.min(...data.map((d) => d.value), 60);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <ReferenceArea y1={70} y2={140} fill="hsl(142 76% 36%)" fillOpacity={0.06} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minVal - 10, maxVal + 10]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            fontSize: 13,
          }}
          formatter={(value: number) => [`${value} mg/dL`, 'Glucose']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(262 83% 58%)"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 0, fill: 'hsl(262 83% 58%)' }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BPProps {
  data: { date: string; systolic: number; diastolic: number }[];
}

export function BloodPressureChart({ data }: BPProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
        No BP readings yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <ReferenceArea y1={60} y2={120} fill="hsl(142 76% 36%)" fillOpacity={0.06} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '0.75rem',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            fontSize: 13,
          }}
          formatter={(value: number, name: string) => [
            `${value} mmHg`,
            name === 'systolic' ? 'Systolic' : 'Diastolic',
          ]}
        />
        <Line type="monotone" dataKey="systolic" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: 'hsl(0 84% 60%)' }} />
        <Line type="monotone" dataKey="diastolic" stroke="hsl(221 83% 53%)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: 'hsl(221 83% 53%)' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
