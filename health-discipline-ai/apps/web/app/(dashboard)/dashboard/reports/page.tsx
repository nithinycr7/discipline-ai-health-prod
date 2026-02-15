'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { patientsApi } from '@/lib/api/patients';

export default function ReportsPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    patientsApi.list(token)
      .then((res) => setPatients(res.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="space-y-6">
        {patients.map((patient: any) => (
          <Card key={patient._id}>
            <CardHeader>
              <CardTitle>{patient.preferredName}'s Reports</CardTitle>
              <CardDescription>{patient.fullName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Weekly Health Report</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Comprehensive weekly summary sent every Sunday via WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Includes: adherence %, per-medicine breakdown, vitals trends, mood summary
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Vitals Tracking</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {patient.hasGlucometer || patient.hasBPMonitor
                      ? 'Vitals are collected during daily calls'
                      : 'No monitoring devices configured'}
                  </p>
                  {patient.hasGlucometer && <p className="text-xs text-green-600">Glucose monitoring active</p>}
                  {patient.hasBPMonitor && <p className="text-xs text-green-600">BP monitoring active</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {patients.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No patients added yet. Add a parent to start receiving reports.
          </div>
        )}
      </div>
    </div>
  );
}
