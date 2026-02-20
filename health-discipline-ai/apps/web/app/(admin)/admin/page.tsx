'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function AdminOverview() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      adminApi.getOverview(token),
      adminApi.getAlerts(token),
    ]).then(([ov, al]) => {
      setOverview(ov);
      setAlerts(al);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!overview) return <p className="text-muted-foreground">Failed to load overview.</p>;

  const callsChartData = [
    { name: 'Completed', value: overview.callsToday.completed, color: '#10b981' },
    { name: 'Failed', value: overview.callsToday.failed, color: '#ef4444' },
    { name: 'Pending', value: overview.callsToday.pending, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const patientBreakdown = [
    { name: 'Active', value: overview.activePatients, color: '#10b981' },
    { name: 'Paused', value: overview.pausedPatients, color: '#6b7280' },
    { name: 'Trial', value: overview.trialPatients, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patients</p>
            <p className="text-3xl font-bold mt-1">{overview.totalPatients}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{overview.activePatients} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Adherence</p>
            <p className={cn('text-3xl font-bold mt-1',
              overview.avgAdherenceToday >= 80 ? 'text-green-600' :
              overview.avgAdherenceToday >= 50 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {overview.avgAdherenceToday}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">today across all</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Calls Today</p>
            <p className="text-3xl font-bold mt-1">{overview.callsToday.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{overview.callsToday.completed} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Complaints</p>
            <p className={cn('text-3xl font-bold mt-1', overview.complaintsToday > 0 ? 'text-red-600' : 'text-green-600')}>
              {overview.complaintsToday}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{overview.criticalMissesToday} critical misses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MRR</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {overview.mrr > 0 ? `₹${overview.mrr.toLocaleString('en-IN')}` : '--'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">monthly recurring</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Calls Today Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
          </CardHeader>
          <CardContent>
            {callsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={callsChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {callsChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">No calls yet today</div>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {callsChartData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patient Status</CardTitle>
          </CardHeader>
          <CardContent>
            {patientBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={patientBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {patientBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">No patients</div>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {patientBreakdown.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/alerts" className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
              <span className="text-sm font-medium text-red-700">Active Alerts</span>
              <Badge variant="destructive">{alerts.length}</Badge>
            </Link>
            <Link href="/admin/patients?status=active" className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <span className="text-sm font-medium text-green-700">Active Patients</span>
              <span className="text-sm font-bold text-green-700">{overview.activePatients}</span>
            </Link>
            <Link href="/admin/analytics/business" className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <span className="text-sm font-medium text-blue-700">Business Analytics</span>
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            <Link href="/admin/analytics/operations" className="flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
              <span className="text-sm font-medium text-purple-700">Operations</span>
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Feed */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Today&apos;s Alerts</CardTitle>
            <Link href="/admin/alerts" className="text-xs text-primary hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No alerts today — all looking good!</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alerts.slice(0, 15).map((alert, i) => (
                <Link key={i} href={`/admin/patients/${alert.patientId}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      )} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{alert.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                      </div>
                    </div>
                    <Badge variant={
                      alert.severity === 'critical' ? 'destructive' :
                      alert.severity === 'warning' ? 'warning' : 'secondary'
                    } className="shrink-0 ml-2">
                      {alert.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
