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
import { cn } from '@/lib/utils';
import { AdherenceTrendChart } from '@/components/charts/adherence-trend-chart';
import { GlucoseChart, BloodPressureChart } from '@/components/charts/vitals-chart';
import { MedicineAdherenceChart } from '@/components/charts/medicine-adherence-chart';

export default function PatientDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [adherence, setAdherence] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [callsTotal, setCallsTotal] = useState(0);
  const [callsPage, setCallsPage] = useState(1);
  const [callsLoading, setCallsLoading] = useState(false);
  const CALLS_PER_PAGE = 5;
  const [calendar, setCalendar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'today' | 'calendar' | 'calls' | 'medicines'>('overview');
  const [statsDays, setStatsDays] = useState(30);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    loadData();
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    patientsApi.getStats(id as string, statsDays, token!).then((res) => setStats(res.data || res)).catch(() => {});
  }, [token, id, statsDays]);

  const loadData = async () => {
    try {
      const [patientRes, medsRes, adherenceRes, callsRes, calendarRes, statsRes] = await Promise.all([
        patientsApi.get(id as string, token!),
        medicinesApi.list(id as string, token!),
        patientsApi.getAdherenceToday(id as string, token!).catch(() => null),
        callsApi.list(id as string, `page=1&limit=${CALLS_PER_PAGE}`, token!).catch(() => ({ data: { calls: [], total: 0 } })),
        patientsApi.getAdherenceCalendar(id as string, new Date().toISOString().slice(0, 7), token!).catch(() => null),
        patientsApi.getStats(id as string, statsDays, token!).catch(() => null),
      ]);

      setPatient(patientRes.data || patientRes);
      setMedicines((medsRes.data || medsRes) || []);
      setAdherence(adherenceRes?.data || adherenceRes);
      const callsData = callsRes.data || callsRes;
      setCalls(callsData?.calls || []);
      setCallsTotal(callsData?.total || 0);
      setCallsPage(1);
      setCalendar(calendarRes?.data || calendarRes);
      setStats(statsRes?.data || statsRes);
    } catch (err) {
      console.error('Failed to load patient data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCallsPage = async (page: number) => {
    if (!token || !id) return;
    setCallsLoading(true);
    try {
      const res = await callsApi.list(id as string, `page=${page}&limit=${CALLS_PER_PAGE}`, token);
      const data = res.data || res;
      setCalls(data?.calls || []);
      setCallsTotal(data?.total || 0);
      setCallsPage(page);
    } catch (err) {
      console.error('Failed to load calls', err);
    } finally {
      setCallsLoading(false);
    }
  };

  const totalCallPages = Math.ceil(callsTotal / CALLS_PER_PAGE);

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
    return <div className="text-center py-20 text-muted-foreground">Patient not found</div>;
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'today', label: 'Today' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'calls', label: 'Calls' },
    { key: 'medicines', label: 'Medicines' },
  ] as const;

  return (
    <div>
      {/* Patient Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg sm:text-xl font-bold text-primary">
              {patient.preferredName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{patient.preferredName}</h1>
              {patient.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 23a7.5 7.5 0 0 1-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 5-2.47.27.68.5 1.43.5 2.22A7.5 7.5 0 0 1 12 23z"/></svg>
                  {patient.currentStreak}
                </span>
              )}
              {patient.isPaused && <Badge variant="warning">Paused</Badge>}
              {patient.subscriptionStatus === 'trial' && <Badge variant="secondary">Trial</Badge>}
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">
              {patient.fullName} &middot; Age {patient.age} &middot; {patient.preferredLanguage?.toUpperCase()}
              {patient.healthConditions?.length > 0 && (
                <> &middot; {patient.healthConditions.join(', ')}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg text-xs sm:text-sm"
            disabled={previewLoading}
            onClick={async () => {
              if (audioUrl) {
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
              } finally {
                setPreviewLoading(false);
              }
            }}
          >
            {previewLoading ? 'Generating...' : audioUrl ? 'Play Again' : 'Preview Call'}
          </Button>
          {patient.isPaused ? (
            <Button onClick={handleResume} size="sm" className="rounded-lg text-xs sm:text-sm">Resume Calls</Button>
          ) : (
            <Button onClick={handlePause} variant="outline" size="sm" className="rounded-lg text-xs sm:text-sm">Pause Calls</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-secondary/50 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today</p>
                <p className={cn('text-3xl font-bold mt-1', adherence ? (adherence.adherencePercentage >= 100 ? 'text-green-600' : adherence.adherencePercentage > 0 ? 'text-yellow-600' : 'text-muted-foreground') : 'text-muted-foreground')}>
                  {adherence ? `${adherence.adherencePercentage}%` : '--'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {adherence ? `${adherence.taken}/${adherence.totalMedicines} meds` : 'No call yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Streak</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-orange-600">{patient.currentStreak || 0}</p>
                  <p className="text-sm text-muted-foreground">days</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Best: {patient.longestStreak || 0} days
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Calls</p>
                <p className="text-3xl font-bold mt-1">{stats?.callStats?.completed || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats?.callStats?.noAnswer || 0} missed &middot; {stats?.callStats?.total || 0} total
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mood</p>
                <p className="text-lg font-semibold mt-1 capitalize truncate">
                  {adherence?.moodNotes || stats?.moodHistory?.[stats.moodHistory.length - 1]?.mood || '--'}
                </p>
                {stats?.moodHistory?.length > 0 && stats.moodHistory[stats.moodHistory.length - 1]?.complaints?.length > 0 && (
                  <p className="text-xs text-destructive mt-0.5 truncate">
                    {stats.moodHistory[stats.moodHistory.length - 1].complaints.join(', ')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Period selector */}
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  statsDays === d ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setStatsDays(d)}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Adherence Trend */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Adherence Trend</CardTitle>
              <CardDescription>Daily medicine compliance over {statsDays} days</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.adherenceTrend ? (
                <AdherenceTrendChart data={stats.adherenceTrend} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* Vitals Charts */}
          {(patient.hasGlucometer || patient.hasBPMonitor) && (
            <div className="grid gap-6 md:grid-cols-2">
              {patient.hasGlucometer && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Glucose</CardTitle>
                    <CardDescription>Fasting blood sugar (mg/dL) &middot; green = normal range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GlucoseChart data={stats?.vitalsHistory?.glucose || []} />
                  </CardContent>
                </Card>
              )}
              {patient.hasBPMonitor && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Blood Pressure</CardTitle>
                    <CardDescription>Systolic (red) & diastolic (blue) mmHg</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BloodPressureChart data={stats?.vitalsHistory?.bloodPressure || []} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Per-Medicine Adherence */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Per-Medicine Adherence</CardTitle>
              <CardDescription>Compliance rate for each medicine ({statsDays} days)</CardDescription>
            </CardHeader>
            <CardContent>
              <MedicineAdherenceChart data={stats?.perMedicineAdherence || []} />
            </CardContent>
          </Card>

          {/* Mood Timeline */}
          {stats?.moodHistory?.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mood & Wellness</CardTitle>
                <CardDescription>Recent mood reports from daily calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {stats.moodHistory.slice(-10).reverse().map((entry: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="shrink-0 mt-0.5">
                        <span className={cn(
                          'inline-block w-2.5 h-2.5 rounded-full',
                          entry.mood?.match(/cheerful|happy|good/i) ? 'bg-green-500' :
                          entry.mood?.match(/tired|okay|fine/i) ? 'bg-yellow-500' :
                          entry.mood?.match(/sad|low|pain/i) ? 'bg-red-500' : 'bg-gray-400'
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">{entry.mood || 'No mood noted'}</p>
                        {entry.complaints?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.complaints.map((c: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== TODAY TAB ===== */}
      {activeTab === 'today' && adherence && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="border-border/50">
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
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardDescription>Glucose</CardDescription>
                  <CardTitle className="text-3xl">{adherence.vitals.glucose} <span className="text-lg font-normal text-muted-foreground">mg/dL</span></CardTitle>
                </CardHeader>
              </Card>
            )}
            {adherence.moodNotes && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardDescription>Wellness</CardDescription>
                  <CardTitle className="text-lg capitalize">{adherence.moodNotes}</CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Medicine Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {adherence.medicineDetails?.map((med: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      {med.nickname && med.nickname !== med.name && (
                        <p className="text-sm text-muted-foreground">&ldquo;{med.nickname}&rdquo;</p>
                      )}
                    </div>
                    <Badge variant={med.status === 'taken' ? 'success' : med.status === 'missed' ? 'destructive' : 'secondary'}>
                      {med.status}
                    </Badge>
                  </div>
                ))}
                {(!adherence.medicineDetails || adherence.medicineDetails.length === 0) && (
                  <p className="text-muted-foreground text-center py-6">No call data for today yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complaints from today */}
          {adherence.complaints?.length > 0 && (
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  Complaints Reported
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {adherence.complaints.map((c: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-sm text-destructive border-destructive/30 px-3 py-1">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'today' && !adherence && (
        <div className="text-center py-16 text-muted-foreground">No adherence data available for today.</div>
      )}

      {/* ===== CALENDAR TAB ===== */}
      {activeTab === 'calendar' && calendar && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Adherence</CardTitle>
            <CardDescription>Overall: {calendar.monthlyAdherence}%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">{day}</div>
              ))}
              {calendar.days?.map((day: any) => {
                const date = new Date(day.date);
                const dayOfWeek = date.getDay();
                const isFirst = date.getDate() === 1;
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm font-medium',
                      day.status === 'full' ? 'bg-green-500 text-white' :
                      day.status === 'partial' ? 'bg-yellow-500 text-white' :
                      day.status === 'missed' ? 'bg-red-500 text-white' :
                      'bg-secondary text-muted-foreground'
                    )}
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

      {activeTab === 'calendar' && !calendar && (
        <div className="text-center py-16 text-muted-foreground">No calendar data available.</div>
      )}

      {/* ===== CALLS TAB ===== */}
      {activeTab === 'calls' && (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Call History</CardTitle>
              {callsTotal > 0 && <CardDescription>{callsTotal} total call{callsTotal !== 1 ? 's' : ''}</CardDescription>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {callsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {calls.map((call: any) => (
                    <div key={call._id} className="p-3 sm:p-3.5 rounded-xl bg-secondary/50">
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">
                            {new Date(call.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                            {new Date(call.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Duration: {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : 'N/A'}
                            {call.medicinesChecked?.length > 0 && (
                              <> &middot; {call.medicinesChecked.filter((m: any) => m.response === 'taken').length}/{call.medicinesChecked.length} taken</>
                            )}
                            {call.moodNotes && <> &middot; Mood: {call.moodNotes}</>}
                          </p>
                        </div>
                        <Badge className="shrink-0" variant={call.status === 'completed' ? 'success' : call.status === 'no_answer' ? 'warning' : call.status === 'failed' ? 'destructive' : 'secondary'}>
                          {call.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      {call.complaints?.length > 0 && call.complaints.some((c: string) => c && c !== 'none') && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/30">
                          <span className="text-xs text-destructive font-medium">Complaints:</span>
                          {call.complaints.filter((c: string) => c && c !== 'none').map((c: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] sm:text-xs text-destructive border-destructive/30">{c}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {calls.length === 0 && <p className="text-muted-foreground text-center py-6">No calls yet</p>}
                </>
              )}
            </div>
            {totalCallPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground">Page {callsPage} of {totalCallPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg text-xs sm:text-sm" disabled={callsPage <= 1 || callsLoading} onClick={() => loadCallsPage(callsPage - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs sm:text-sm" disabled={callsPage >= totalCallPages || callsLoading} onClick={() => loadCallsPage(callsPage + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== MEDICINES TAB ===== */}
      {activeTab === 'medicines' && (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Medicines</CardTitle>
              <CardDescription>{medicines.length} active medicines</CardDescription>
            </div>
            <Link href={`/dashboard/patients/${id}/medicines/add`}>
              <Button size="sm" className="rounded-lg">Add Medicine</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {medicines.map((med: any) => (
                <div key={med._id} className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-secondary/50">
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{med.brandName}</p>
                    {med.genericName && <p className="text-xs sm:text-sm text-muted-foreground truncate">{med.genericName}</p>}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{med.timing}</Badge>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{med.foodPreference} food</Badge>
                      {med.nicknames?.length > 0 && <Badge variant="secondary" className="text-[10px] sm:text-xs">&ldquo;{med.nicknames[0]}&rdquo;</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-1.5 shrink-0">
                    {med.needsReview && <Badge variant="warning">Review</Badge>}
                    {med.isCritical && <Badge variant="destructive">Critical</Badge>}
                  </div>
                </div>
              ))}
              {medicines.length === 0 && <p className="text-muted-foreground text-center py-6">No medicines added yet</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
