'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/use-auth';
import { patientsApi } from '@/lib/api/patients';

export default function PatientsListPage() {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    patientsApi.list(token)
      .then((res) => setPatients(res.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = patients.filter((p: any) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.preferredName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
        <Link href="/onboarding/patient-info">
          <Button className="rounded-lg">Add Patient</Button>
        </Link>
      </div>

      {user?.role === 'hospital_admin' && (
        <div className="mb-6">
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm rounded-lg"
          />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((patient: any) => (
          <Link key={patient._id} href={`/dashboard/patients/${patient._id}`}>
            <Card className="hover:shadow-md transition-all cursor-pointer mb-3 border-border/50 hover:border-border">
              <CardContent className="flex items-start sm:items-center justify-between gap-3 p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-primary">
                      {patient.preferredName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base">{patient.preferredName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {patient.fullName} &middot; Age {patient.age} &middot; {patient.preferredLanguage?.toUpperCase()}
                    </p>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5">
                      {patient.healthConditions?.map((c: string) => (
                        <Badge key={c} variant="outline" className="text-[10px] sm:text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {patient.isPaused ? (
                    <Badge variant="secondary">Paused</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">
                    {patient.callsCompletedCount} calls
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {search ? 'No patients match your search' : 'No patients added yet'}
          </div>
        )}
      </div>
    </div>
  );
}
