'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { AdherenceTrendChart } from '@/components/charts/adherence-trend-chart';
import { MedicineAdherenceChart } from '@/components/charts/medicine-adherence-chart';

export default function AdminPatientDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [callsTotal, setCallsTotal] = useState(0);
  const [callsPage, setCallsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'calls'>('overview');
  const [statsDays, setStatsDays] = useState(30);

  useEffect(() => {
    if (!token || !id) return;
    Promise.all([
      adminApi.getPatient(id as string, token),
      adminApi.getPatientStats(id as string, token, statsDays),
      adminApi.getPatientCalls(id as string, token, 1),
    ]).then(([p, s, c]) => {
      setPatient(p);
      setStats(s);
      setCalls(c.calls || []);
      setCallsTotal(c.total || 0);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token, id, statsDays]);

  const loadCalls = async (page: number) => {
    if (!token || !id) return;
    const c = await adminApi.getPatientCalls(id as string, token, page);
    setCalls(c.calls || []);
    setCallsTotal(c.total || 0);
    setCallsPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!patient) return <p className="text-muted-foreground">Patient not found.</p>;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'calls', label: 'Calls' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/patients" className="text-xs text-primary hover:underline mb-2 inline-block">&larr; Back to patients</Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{patient.preferredName?.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{patient.preferredName}</h1>
            <p className="text-sm text-muted-foreground">
              {patient.fullName} &middot; Age {patient.age} &middot; {patient.phone} &middot; {patient.preferredLanguage?.toUpperCase()}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge variant={patient.isPaused ? 'secondary' : 'default'}>
              {patient.isPaused ? 'Paused' : 'Active'}
            </Badge>
            <Badge variant={
              patient.subscriptionStatus === 'active' ? 'success' :
              patient.subscriptionStatus === 'trial' ? 'warning' : 'secondary'
            }>
              {patient.subscriptionStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-2xl font-bold text-orange-600">{patient.currentStreak || 0}</p>
            <p className="text-[10px] text-muted-foreground">best: {patient.longestStreak || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Calls Done</p>
            <p className="text-2xl font-bold">{patient.callsCompletedCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Call Success</p>
            <p className="text-2xl font-bold">
              {stats?.callStats ? `${Math.round((stats.callStats.completed / Math.max(stats.callStats.total, 1)) * 100)}%` : '--'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Conditions</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {patient.healthConditions?.length > 0
                ? patient.healthConditions.map((c: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>
                  ))
                : <span className="text-xs text-muted-foreground">None</span>
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Last Call</p>
            <p className="text-sm font-medium">
              {patient.lastCallAt
                ? new Date(patient.lastCallAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-4 flex gap-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setStatsDays(d)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                statsDays === d ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-200'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Adherence Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Adherence Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <AdherenceTrendChart data={stats.adherenceTrend} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Per-medicine adherence */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Per-Medicine Adherence</CardTitle>
              </CardHeader>
              <CardContent>
                <MedicineAdherenceChart data={stats.perMedicineAdherence} />
              </CardContent>
            </Card>

            {/* Mood & Complaints */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mood & Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.moodHistory?.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {stats.moodHistory.slice().reverse().map((entry: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          entry.mood === 'good' ? 'bg-green-500' :
                          entry.mood === 'okay' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                        <div>
                          <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-sm capitalize">{entry.mood}</p>
                          {entry.complaints?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.complaints.map((c: string, j: number) => (
                                <Badge key={j} variant="destructive" className="text-[10px]">{c}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No mood data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'calls' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Call History ({callsTotal})</CardTitle>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No calls yet</p>
            ) : (
              <div className="space-y-2">
                {calls.map((call: any) => (
                  <div key={call._id} className="p-3 rounded-lg bg-slate-50 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(call.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}
                        {new Date(call.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={
                          call.status === 'completed' ? 'success' :
                          call.status === 'scheduled' ? 'secondary' : 'destructive'
                        }>
                          {call.status}
                        </Badge>
                        {call.duration && <span className="text-xs text-muted-foreground">{Math.round(call.duration)}s</span>}
                        {call.voiceStack && <span className="text-xs text-muted-foreground">{call.voiceStack}</span>}
                      </div>
                      {call.moodNotes && <p className="text-xs text-muted-foreground mt-1">Mood: {call.moodNotes}</p>}
                      {call.complaints?.filter((c: string) => c && c !== 'none').length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {call.complaints.filter((c: string) => c && c !== 'none').map((c: string, i: number) => (
                            <Badge key={i} variant="destructive" className="text-[10px]">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {call.medicinesChecked?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {call.medicinesChecked.filter((m: any) => m.response === 'taken').length}/{call.medicinesChecked.length} meds
                        </p>
                      )}
                      {call.totalCharges > 0 && (
                        <p className="text-[10px] text-muted-foreground">${call.totalCharges.toFixed(3)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {callsTotal > 20 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={callsPage <= 1} onClick={() => loadCalls(callsPage - 1)}>Previous</Button>
                <span className="text-xs text-muted-foreground self-center">Page {callsPage}</span>
                <Button variant="outline" size="sm" disabled={callsPage * 20 >= callsTotal} onClick={() => loadCalls(callsPage + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
