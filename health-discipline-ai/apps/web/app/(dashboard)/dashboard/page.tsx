'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  adherence?: { adherencePercentage: number; taken: number; totalMedicines: number };
  lastCallAt?: string;
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
                    <CardTitle className="text-lg">{patient.preferredName}</CardTitle>
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
                    {total > 0 && (
                      <div className="text-right">
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
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
