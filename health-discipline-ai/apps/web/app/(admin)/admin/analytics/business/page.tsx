'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const SUB_COLORS: Record<string, string> = {
  trial: '#3b82f6',
  active: '#10b981',
  past_due: '#f59e0b',
  cancelled: '#ef4444',
  expired: '#6b7280',
};

const PLAN_COLORS: Record<string, string> = {
  suraksha: '#8b5cf6',
  sampurna: '#06b6d4',
};

export default function BusinessAnalytics() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminApi.getBusinessAnalytics(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Failed to load.</p>;

  const subPieData = Object.entries(data.patientSubscriptionBreakdown)
    .filter(([, count]) => (count as number) > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count as number,
      fill: SUB_COLORS[status] || '#6b7280',
    }));

  const planPieData = Object.entries(data.planBreakdown)
    .filter(([, count]) => (count as number) > 0)
    .map(([plan, count]) => ({
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      value: count as number,
      fill: PLAN_COLORS[plan] || '#6b7280',
    }));

  // Cumulative growth
  let cumulative = 0;
  const growthData = data.patientGrowth.map((d: any) => {
    cumulative += d.newPatients;
    return { ...d, total: cumulative, label: d.month };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Business Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Subscription, revenue, and growth metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">MRR</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {data.mrr > 0 ? `₹${data.mrr.toLocaleString('en-IN')}` : '--'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Patients</p>
            <p className="text-3xl font-bold mt-1">{data.totalPatients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Payers</p>
            <p className="text-3xl font-bold mt-1">{data.totalPayers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Churn Rate</p>
            <p className={cn('text-3xl font-bold mt-1', data.churnRate > 20 ? 'text-red-600' : 'text-green-600')}>
              {data.churnRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Trial Conversion</p>
            <p className={cn('text-3xl font-bold mt-1', data.trialConversionRate >= 30 ? 'text-green-600' : 'text-yellow-600')}>
              {data.trialConversionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Subscription Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patient Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            {subPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={subPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                      {subPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {subPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No subscription data</div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan Distribution (Active)</CardTitle>
          </CardHeader>
          <CardContent>
            {planPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={planPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                      {planPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {planPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No active plans</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Growth */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Patient Growth</CardTitle>
        </CardHeader>
        <CardContent>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', fontSize: 13 }} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="#3b82f620" name="Total Patients" />
                <Bar dataKey="newPatients" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.5} name="New" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">No growth data</div>
          )}
        </CardContent>
      </Card>

      {/* Detailed breakdown table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Subscription Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(data.patientSubscriptionBreakdown).map(([status, count]) => (
              <div key={status} className="text-center p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: SUB_COLORS[status] }}>{count as number}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
