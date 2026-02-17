'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { patientsApi } from '@/lib/api/patients';
import { cn } from '@/lib/utils';
import { AdherenceTrendChart } from '@/components/charts/adherence-trend-chart';
import { MedicineAdherenceChart } from '@/components/charts/medicine-adherence-chart';
import { GlucoseChart, BloodPressureChart } from '@/components/charts/vitals-chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function AdherenceDonut({ stats }: { stats: any }) {
  if (!stats?.perMedicineAdherence?.length) return null;
  const total = stats.perMedicineAdherence.reduce((s: number, m: any) => s + m.total, 0);
  const taken = stats.perMedicineAdherence.reduce((s: number, m: any) => s + m.taken, 0);
  const missed = total - taken;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  const data = [
    { name: 'Taken', value: taken, color: 'hsl(142 76% 36%)' },
    { name: 'Missed', value: missed, color: 'hsl(0 84% 60%)' },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={48} paddingAngle={2} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{pct}%</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-sm">{taken} taken</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-sm">{missed} missed</span>
        </div>
        <p className="text-xs text-muted-foreground">{total} total checks</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (!token) return;
    patientsApi.list(token)
      .then((res) => {
        const list = res.data || res || [];
        setPatients(list);
        if (list.length > 0) setSelectedPatient(list[0]._id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedPatient) return;
    setStatsLoading(true);
    patientsApi.getStats(selectedPatient, days, token)
      .then((res) => setStats(res.data || res))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [token, selectedPatient, days]);

  const selectedPatientData = patients.find((p) => p._id === selectedPatient);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No patients added yet. Add a parent to start receiving reports.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
      </div>

      {/* Patient selector + period */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
          {patients.map((p) => (
            <button
              key={p._id}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                selectedPatient === p._id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setSelectedPatient(p._id)}
            >
              {p.preferredName}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                days === d ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setDays(d)}
            >
              {d === 7 ? 'This Week' : d === 14 ? '2 Weeks' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Summary Stats Row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Calls Completed</p>
                <p className="text-3xl font-bold mt-1">{stats.callStats?.completed || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">of {stats.callStats?.total || 0} total</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">No-Answer</p>
                <p className={cn('text-3xl font-bold mt-1', (stats.callStats?.noAnswer || 0) > 3 ? 'text-red-600' : '')}>
                  {stats.callStats?.noAnswer || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">calls unanswered</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{selectedPatientData?.currentStreak || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">best: {selectedPatientData?.longestStreak || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mood Reports</p>
                <p className="text-3xl font-bold mt-1">{stats.moodHistory?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">recorded this period</p>
              </CardContent>
            </Card>
          </div>

          {/* Overall Adherence + Donut */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Adherence Overview</CardTitle>
                <CardDescription>Medicine taken vs missed ({days} days)</CardDescription>
              </CardHeader>
              <CardContent>
                <AdherenceDonut stats={stats} />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Per-Medicine Breakdown</CardTitle>
                <CardDescription>Individual compliance rates</CardDescription>
              </CardHeader>
              <CardContent>
                <MedicineAdherenceChart data={stats.perMedicineAdherence || []} />
              </CardContent>
            </Card>
          </div>

          {/* Adherence Trend */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Adherence Trend</CardTitle>
              <CardDescription>Percentage of medicines taken each day</CardDescription>
            </CardHeader>
            <CardContent>
              <AdherenceTrendChart data={stats.adherenceTrend || []} />
            </CardContent>
          </Card>

          {/* Vitals */}
          {(selectedPatientData?.hasGlucometer || selectedPatientData?.hasBPMonitor) && (
            <div className="grid gap-6 md:grid-cols-2">
              {selectedPatientData?.hasGlucometer && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Glucose Trend</CardTitle>
                    <CardDescription>Blood sugar readings (mg/dL)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GlucoseChart data={stats.vitalsHistory?.glucose || []} />
                  </CardContent>
                </Card>
              )}
              {selectedPatientData?.hasBPMonitor && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Blood Pressure Trend</CardTitle>
                    <CardDescription>Systolic & diastolic (mmHg)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BloodPressureChart data={stats.vitalsHistory?.bloodPressure || []} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Mood & Complaints Log */}
          {stats.moodHistory?.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mood & Wellness Log</CardTitle>
                <CardDescription>All recorded mood observations this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.moodHistory.slice().reverse().map((entry: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                      <span className={cn(
                        'inline-block w-2.5 h-2.5 rounded-full mt-1 shrink-0',
                        entry.mood?.match(/cheerful|happy|good/i) ? 'bg-green-500' :
                        entry.mood?.match(/tired|okay|fine/i) ? 'bg-yellow-500' :
                        entry.mood?.match(/sad|low|pain/i) ? 'bg-red-500' : 'bg-gray-400'
                      )} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium capitalize">{entry.mood || 'No mood noted'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {entry.complaints?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.complaints.map((c: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
