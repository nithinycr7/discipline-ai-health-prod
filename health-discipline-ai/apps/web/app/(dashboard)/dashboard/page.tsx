'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { patientsApi } from '@/lib/api/patients';
import { cn, getAdherenceBgColor } from '@/lib/utils';

interface PatientSummary {
  _id: string;
  fullName: string;
  preferredName: string;
  isPaused: boolean;
  isNewPatient: boolean;
  currentStreak?: number;
  longestStreak?: number;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  healthConditions?: string[];
  adherence?: { adherencePercentage: number; taken: number; totalMedicines: number; moodNotes?: string; complaints?: string[] };
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadPatients();
  }, [token]);

  const loadPatients = async () => {
    try {
      const res = await patientsApi.list(token!);
      const patientList = res.data || res;

      const withAdherence = await Promise.all(
        patientList.map(async (p: any) => {
          try {
            const adherence = await patientsApi.getAdherenceToday(p._id, token!);
            return { ...p, adherence: adherence.data || adherence };
          } catch {
            return p;
          }
        })
      );

      setPatients(withAdherence);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome! Let&apos;s get started</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Add your parent to start monitoring their medicine adherence with daily AI calls.
        </p>
        <Link href="/onboarding/patient-info">
          <Button size="lg" className="rounded-xl px-8">Add Your Parent</Button>
        </Link>
      </div>
    );
  }

  // Compute aggregate stats
  const activePatients = patients.filter((p) => !p.isPaused);
  const totalAdherenceToday = activePatients.length > 0
    ? Math.round(activePatients.reduce((sum, p) => sum + (p.adherence?.adherencePercentage ?? 0), 0) / activePatients.length)
    : 0;
  const streakPatients = patients.filter((p) => (p.currentStreak || 0) >= 7).length;

  // Needs attention: missed critical meds, no-answer patterns, trial expiring
  const needsAttention: { patient: PatientSummary; reason: string; severity: 'high' | 'medium' | 'low' }[] = [];
  for (const p of patients) {
    if (p.isPaused) continue;
    const pct = p.adherence?.adherencePercentage;
    const total = p.adherence?.totalMedicines ?? 0;
    if (pct !== undefined && pct < 50 && total > 0) {
      needsAttention.push({ patient: p, reason: `Only ${pct}% adherence today (${p.adherence!.taken}/${total} meds)`, severity: 'high' });
    }
    if (p.subscriptionStatus === 'trial' && p.trialEndsAt) {
      const daysLeft = Math.ceil((new Date(p.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 3) {
        needsAttention.push({ patient: p, reason: `Trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, severity: 'medium' });
      }
    }
    if (p.adherence?.complaints?.length) {
      needsAttention.push({ patient: p, reason: `Complaints: ${p.adherence.complaints.join(', ')}`, severity: 'high' });
    }
    if (total === 0 && !p.isNewPatient) {
      needsAttention.push({ patient: p, reason: 'No call data today', severity: 'low' });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today&apos;s Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/onboarding/patient-info">
          <Button variant="outline" size="sm" className="rounded-lg">Add Parent</Button>
        </Link>
      </div>

      {/* Aggregate Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patients</p>
            <p className="text-3xl font-bold mt-1">{patients.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activePatients.length} active &middot; {patients.length - activePatients.length} paused</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Adherence</p>
            <p className={cn('text-3xl font-bold mt-1', totalAdherenceToday >= 80 ? 'text-green-600' : totalAdherenceToday >= 50 ? 'text-yellow-600' : 'text-red-600')}>
              {activePatients.some(p => p.adherence?.totalMedicines) ? `${totalAdherenceToday}%` : '--'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">across all patients today</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">On Streaks</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{streakPatients}</p>
            <p className="text-xs text-muted-foreground mt-0.5">patients with 7+ day streaks</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alerts</p>
            <p className={cn('text-3xl font-bold mt-1', needsAttention.length > 0 ? 'text-red-600' : 'text-green-600')}>
              {needsAttention.length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {needsAttention.length > 0 ? 'need your attention' : 'all looking good'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAttention.map((item, i) => (
                <Link key={i} href={`/dashboard/patients/${item.patient._id}`}>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/80 hover:bg-white transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{item.patient.preferredName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.patient.preferredName}</p>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                    </div>
                    <Badge variant={item.severity === 'high' ? 'destructive' : item.severity === 'medium' ? 'warning' : 'secondary'}>
                      {item.severity}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient) => {
          const percentage = patient.adherence?.adherencePercentage ?? 0;
          const taken = patient.adherence?.taken ?? 0;
          const total = patient.adherence?.totalMedicines ?? 0;

          return (
            <Link key={patient._id} href={`/dashboard/patients/${patient._id}`}>
              <Card className={cn(
                'hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border-border/50 hover:border-border',
                getAdherenceBgColor(percentage)
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{patient.preferredName}</CardTitle>
                      {(patient.currentStreak || 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 23a7.5 7.5 0 0 1-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47.27.68.5 1.43.5 2.22A7.5 7.5 0 0 1 12 23z"/></svg>
                          {patient.currentStreak}
                        </span>
                      )}
                    </div>
                    {patient.isPaused ? (
                      <Badge variant="secondary">Paused</Badge>
                    ) : patient.isNewPatient ? (
                      <Badge variant="default">New</Badge>
                    ) : percentage === 100 ? (
                      <Badge variant="success">All Taken</Badge>
                    ) : percentage > 0 ? (
                      <Badge variant="warning">Partial</Badge>
                    ) : total > 0 ? (
                      <Badge variant="destructive">Missed</Badge>
                    ) : (
                      <Badge variant="secondary">No calls yet</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{patient.fullName}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold tracking-tight">
                        {total > 0 ? `${taken}/${total}` : '--'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">medicines taken</p>
                    </div>
                    <div className="text-right">
                      {total > 0 && (
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-16 h-2 rounded-full bg-border overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                percentage === 100 ? 'bg-green-500' :
                                percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{percentage}%</span>
                        </div>
                      )}
                      {patient.adherence?.moodNotes && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{patient.adherence.moodNotes}</p>
                      )}
                    </div>
                  </div>
                  {patient.adherence?.complaints && patient.adherence.complaints.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-destructive font-medium">Complaints:</span>
                      {patient.adherence.complaints.map((c: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs text-destructive border-destructive/30">{c}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
