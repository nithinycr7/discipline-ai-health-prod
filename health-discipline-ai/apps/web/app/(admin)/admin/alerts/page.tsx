'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/use-auth';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const ALERT_TYPES = [
  { key: '', label: 'All' },
  { key: 'complaint', label: 'Complaints' },
  { key: 'missed_critical', label: 'Critical Misses' },
  { key: 'low_adherence', label: 'Low Adherence' },
  { key: 'vitals_alert', label: 'Vitals' },
  { key: 'call_failed', label: 'Failed Calls' },
];

const SEVERITY_ORDER = ['critical', 'warning', 'info'];

export default function AdminAlerts() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    adminApi.getAlerts(token)
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = alerts.filter((a) => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (severityFilter && a.severity !== severityFilter) return false;
    return true;
  });

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">{alerts.length} alerts today</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-3 mb-6">
        <Card className="border-red-200 bg-red-50/50 cursor-pointer" onClick={() => setSeverityFilter(severityFilter === 'critical' ? '' : 'critical')}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-red-700 uppercase">Critical</p>
            <p className="text-3xl font-bold text-red-700">{counts.critical}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50 cursor-pointer" onClick={() => setSeverityFilter(severityFilter === 'warning' ? '' : 'warning')}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-yellow-700 uppercase">Warning</p>
            <p className="text-3xl font-bold text-yellow-700">{counts.warning}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 cursor-pointer" onClick={() => setSeverityFilter(severityFilter === 'info' ? '' : 'info')}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-blue-700 uppercase">Info</p>
            <p className="text-3xl font-bold text-blue-700">{counts.info}</p>
          </CardContent>
        </Card>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALERT_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              typeFilter === t.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          {alerts.length === 0 ? 'No alerts today — all looking good!' : 'No alerts matching filters.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert, i) => (
            <Link key={i} href={`/admin/patients/${alert.patientId}`}>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer">
                <div className={cn(
                  'w-3 h-3 rounded-full shrink-0',
                  alert.severity === 'critical' ? 'bg-red-500' :
                  alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{alert.patientName}</p>
                    <Badge variant={
                      alert.severity === 'critical' ? 'destructive' :
                      alert.severity === 'warning' ? 'warning' : 'secondary'
                    } className="text-[10px]">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{alert.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-[10px]">{alert.type.replace(/_/g, ' ')}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
