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

      // Load adherence for each patient
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
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Welcome! Let's get started</h2>
        <p className="text-muted-foreground mb-6">
          Add your parent to start monitoring their medicine adherence.
        </p>
        <Link href="/onboarding/patient-info">
          <Button size="lg">Add Your Parent</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Today's Overview</h1>
        <Link href="/onboarding/patient-info">
          <Button variant="outline" size="sm">Add Another Parent</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient) => {
          const percentage = patient.adherence?.adherencePercentage ?? 0;
          const taken = patient.adherence?.taken ?? 0;
          const total = patient.adherence?.totalMedicines ?? 0;

          return (
            <Link key={patient._id} href={`/dashboard/patients/${patient._id}`}>
              <Card className={cn('hover:shadow-md transition-shadow cursor-pointer', getAdherenceBgColor(percentage))}>
                <CardHeader className="pb-2">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">
                        {total > 0 ? `${taken}/${total}` : '--'}
                      </p>
                      <p className="text-sm text-muted-foreground">medicines taken</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {total > 0 ? `${percentage}%` : '--'}
                      </p>
                      <p className="text-sm text-muted-foreground">adherence</p>
                    </div>
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
