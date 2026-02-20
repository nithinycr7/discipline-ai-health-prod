'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';

const ADHERENCE_COLORS: Record<string, string> = { '0-25': '#ef4444', '26-50': '#f59e0b', '51-75': '#3b82f6', '76-100': '#10b981' };
const MOOD_COLORS: Record<string, string> = { good: '#10b981', okay: '#f59e0b', not_well: '#ef4444', unknown: '#9ca3af' };

export default function HealthAnalytics() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminApi.getHealthAnalytics(token, days)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Failed to load.</p>;

  const adherenceData = Object.entries(data.adherenceDistribution).map(([range, count]) => ({
    range,
    patients: count as number,
    fill: ADHERENCE_COLORS[range],
  }));

  const moodData = Object.entries(data.moodDistribution)
    .filter(([, count]) => (count as number) > 0)
    .map(([mood, count]) => ({
      name: mood === 'not_well' ? 'Not Well' : mood.charAt(0).toUpperCase() + mood.slice(1),
      value: count as number,
      fill: MOOD_COLORS[mood],
    }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.totalPatientsTracked} patients with data / {data.totalPatientsRegistered} active &middot; Last {days} days
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                days === d ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Critical Misses</p>
            <p className={cn('text-3xl font-bold mt-1', data.criticalMisses > 0 ? 'text-red-600' : 'text-green-600')}>
              {data.criticalMisses}
            </p>
            <p className="text-xs text-muted-foreground">critical medicines missed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Top Complaint</p>
            <p className="text-lg font-bold mt-1 truncate">
              {data.topComplaints.length > 0 ? data.topComplaints[0].complaint : 'None'}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.topComplaints.length > 0 ? `${data.topComplaints[0].count} occurrences` : 'No complaints'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Patients Tracked</p>
            <p className="text-3xl font-bold mt-1">{data.totalPatientsTracked}</p>
            <p className="text-xs text-muted-foreground">had at least 1 call</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Adherence Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Adherence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adherenceData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', fontSize: 13 }} />
                <Bar dataKey="patients" radius={[6, 6, 0, 0]}>
                  {adherenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">Average adherence % per patient</p>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mood Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {moodData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={moodData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                      {moodData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {moodData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No mood data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaints Trend */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Complaints Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.complaintsTrend.map((d: any) => ({
              ...d,
              label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            }))} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', fontSize: 13 }} />
              <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} fill="#ef444420" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Complaints */}
      {data.topComplaints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topComplaints.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <span className="text-sm font-medium">{c.complaint}</span>
                  <span className="text-sm font-bold text-red-600">{c.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
