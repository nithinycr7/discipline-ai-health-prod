'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, LineChart, Line,
} from 'recharts';

export default function OperationsAnalytics() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminApi.getOperationsAnalytics(token, days)
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

  const chartData = data.dailyTrend.map((d: any) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Call performance, costs, and voice stack metrics</p>
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

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase">Total Calls</p>
            <p className="text-2xl font-bold">{data.summary.totalCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase">Success Rate</p>
            <p className={cn('text-2xl font-bold', data.summary.successRate >= 70 ? 'text-green-600' : 'text-red-600')}>
              {data.summary.successRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase">Avg Duration</p>
            <p className="text-2xl font-bold">{data.summary.avgDuration}s</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase">Retry Rate</p>
            <p className="text-2xl font-bold">{data.summary.retryRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase">Cost/Call</p>
            <p className="text-2xl font-bold">${data.summary.costPerCall}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase">Total Cost</p>
            <p className="text-2xl font-bold text-red-600">${data.costs.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate Trend */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Daily Call Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Cost Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: 13 }} formatter={(v: number) => [`$${v}`, 'Cost']} />
                <Area type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf620" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avg Duration Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData.filter((d: any) => d.avgDuration > 0)} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}s`} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: 13 }} formatter={(v: number) => [`${v}s`, 'Duration']} />
                <Line type="monotone" dataKey="avgDuration" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Voice Stack Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Voice Stack Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['elevenlabs', 'sarvam'] as const).map((stack) => {
                const s = data.voiceStacks[stack];
                return (
                  <div key={stack} className="p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium capitalize">{stack}</p>
                      <Badge variant={s.successRate >= 70 ? 'success' : 'destructive'}>
                        {s.successRate}% success
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">{s.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-lg font-bold text-green-600">{s.completed}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="text-lg font-bold">${s.cost}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Failure Reasons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failure Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {data.failureReasons.length > 0 ? (
              <div className="space-y-2">
                {data.failureReasons.map((r: any, i: number) => {
                  const total = data.failureReasons.reduce((sum: number, x: any) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize">{r.reason.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-muted-foreground">{r.count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No failures in this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-lg bg-blue-50">
              <p className="text-xs text-blue-700 uppercase font-medium">Twilio</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">${data.costs.twilio}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50">
              <p className="text-xs text-purple-700 uppercase font-medium">ElevenLabs</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">${data.costs.elevenlabs}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-100">
              <p className="text-xs text-slate-700 uppercase font-medium">Total</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${data.costs.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
