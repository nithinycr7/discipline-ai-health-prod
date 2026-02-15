'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { patientsApi } from '@/lib/api/patients';
import { medicinesApi } from '@/lib/api/medicines';
import { callsApi } from '@/lib/api/calls';

export default function PatientDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [adherence, setAdherence] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'calls' | 'medicines'>('today');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    loadData();
  }, [token, id]);

  const loadData = async () => {
    try {
      const [patientRes, medsRes, adherenceRes, callsRes, calendarRes] = await Promise.all([
        patientsApi.get(id as string, token!),
        medicinesApi.list(id as string, token!),
        patientsApi.getAdherenceToday(id as string, token!).catch(() => null),
        callsApi.list(id as string, 'limit=10', token!).catch(() => ({ data: { calls: [] } })),
        patientsApi.getAdherenceCalendar(id as string, new Date().toISOString().slice(0, 7), token!).catch(() => null),
      ]);

      setPatient(patientRes.data || patientRes);
      setMedicines((medsRes.data || medsRes) || []);
      setAdherence(adherenceRes?.data || adherenceRes);
      setCalls((callsRes.data || callsRes)?.calls || []);
      setCalendar(calendarRes?.data || calendarRes);
    } catch (err) {
      console.error('Failed to load patient data', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!token || !id) return;
    await patientsApi.pause(id as string, { reason: 'User requested' }, token);
    loadData();
  };

  const handleResume = async () => {
    if (!token || !id) return;
    await patientsApi.resume(id as string, token);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-20">Patient not found</div>;
  }

  const tabs = [
    { key: 'today', label: "Today's Status" },
    { key: 'calendar', label: 'Calendar' },
    { key: 'calls', label: 'Call History' },
    { key: 'medicines', label: 'Medicines' },
  ] as const;

  return (
    <div>
      {/* Patient Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{patient.preferredName}</h1>
          <p className="text-muted-foreground">
            {patient.fullName} | Age: {patient.age} | Language: {patient.preferredLanguage}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={previewLoading}
            onClick={async () => {
              if (audioUrl) {
                // Already have audio, just play it
                const audio = new Audio(audioUrl);
                audio.play();
                return;
              }
              setPreviewLoading(true);
              try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await fetch(`${API_URL}/api/v1/patients/${id}/test-call/preview`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to generate preview');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                const audio = new Audio(url);
                audio.play();
              } catch (err) {
                console.error('Preview failed:', err);
                alert('Failed to generate call preview. Make sure ElevenLabs is configured.');
              } finally {
                setPreviewLoading(false);
              }
            }}
          >
            {previewLoading ? 'Generating...' : audioUrl ? 'Play Again' : 'Preview Call'}
          </Button>
          {patient.isPaused ? (
            <Button onClick={handleResume} variant="default">Resume Calls</Button>
          ) : (
            <Button onClick={handlePause} variant="outline">Pause Calls</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today Tab */}
      {activeTab === 'today' && adherence && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Adherence Today</CardDescription>
                <CardTitle className="text-3xl">{adherence.adherencePercentage}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {adherence.taken}/{adherence.totalMedicines} medicines taken
                </p>
              </CardContent>
            </Card>
            {adherence.vitals?.glucose && (
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Glucose</CardDescription>
                  <CardTitle className="text-3xl">{adherence.vitals.glucose} mg/dL</CardTitle>
                </CardHeader>
              </Card>
            )}
            {adherence.moodNotes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Mood</CardDescription>
                  <CardTitle className="text-lg">{adherence.moodNotes}</CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Medicine Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adherence.medicineDetails?.map((med: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      {med.nickname && med.nickname !== med.name && (
                        <p className="text-sm text-muted-foreground">"{med.nickname}"</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        med.status === 'taken' ? 'success' :
                        med.status === 'missed' ? 'destructive' : 'secondary'
                      }
                    >
                      {med.status}
                    </Badge>
                  </div>
                ))}
                {(!adherence.medicineDetails || adherence.medicineDetails.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">No call data for today yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && calendar && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Adherence</CardTitle>
            <CardDescription>Overall: {calendar.monthlyAdherence}%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {calendar.days?.map((day: any) => {
                const date = new Date(day.date);
                const dayOfWeek = date.getDay();
                const isFirst = date.getDate() === 1;

                return (
                  <div
                    key={day.date}
                    className={`aspect-square flex items-center justify-center rounded text-sm ${
                      day.status === 'full' ? 'bg-green-500 text-white' :
                      day.status === 'partial' ? 'bg-yellow-500 text-white' :
                      day.status === 'missed' ? 'bg-red-500 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}
                    style={isFirst ? { gridColumnStart: dayOfWeek + 1 } : {}}
                    title={`${day.date}: ${day.adherencePercentage}%`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calls Tab */}
      {activeTab === 'calls' && (
        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calls.map((call: any) => (
                <div key={call._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {new Date(call.scheduledAt).toLocaleDateString()} at{' '}
                      {new Date(call.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duration: {call.duration ? `${Math.round(call.duration / 60)}m ${call.duration % 60}s` : 'N/A'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      call.status === 'completed' ? 'success' :
                      call.status === 'no_answer' ? 'warning' :
                      call.status === 'failed' ? 'destructive' : 'secondary'
                    }
                  >
                    {call.status}
                  </Badge>
                </div>
              ))}
              {calls.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No calls yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medicines Tab */}
      {activeTab === 'medicines' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Medicines</CardTitle>
              <CardDescription>{medicines.length} active medicines</CardDescription>
            </div>
            <Link href={`/dashboard/patients/${id}/medicines/add`}>
              <Button size="sm">Add Medicine</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medicines.map((med: any) => (
                <div key={med._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{med.brandName}</p>
                    {med.genericName && (
                      <p className="text-sm text-muted-foreground">{med.genericName}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{med.timing}</Badge>
                      <Badge variant="outline">{med.foodPreference} food</Badge>
                      {med.nicknames?.length > 0 && (
                        <Badge variant="secondary">"{med.nicknames[0]}"</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {med.needsReview && <Badge variant="warning">Needs Review</Badge>}
                    {med.isCritical && <Badge variant="destructive">Critical</Badge>}
                  </div>
                </div>
              ))}
              {medicines.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No medicines added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
