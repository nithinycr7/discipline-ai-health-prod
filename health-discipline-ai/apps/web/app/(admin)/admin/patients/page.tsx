'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { adminApi } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

export default function AdminPatients() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [subFilter, setSubFilter] = useState(searchParams.get('subscription') || '');
  const [page, setPage] = useState(1);

  const loadPatients = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await adminApi.getPatients(token, {
        search: search || undefined,
        status: statusFilter || undefined,
        subscription: subFilter || undefined,
        page,
        limit: 30,
      });
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, subFilter, page]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All Patients</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.total ?? 0} total patients across the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
        <select
          value={subFilter}
          onChange={(e) => { setSubFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Subscriptions</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : !data || data.patients.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No patients found.</p>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Payer</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Adherence</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Streak</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Subscription</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Language</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Complaints</th>
                  </tr>
                </thead>
                <tbody>
                  {data.patients.map((p: any) => (
                    <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/patients/${p._id}`} className="hover:underline">
                          <p className="font-medium text-slate-900">{p.preferredName}</p>
                          <p className="text-xs text-muted-foreground">{p.fullName} &middot; Age {p.age}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.payer?.name || '--'}
                        {p.payer?.phone && <span className="block">{p.payer.phone}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.adherenceToday >= 0 ? (
                          <span className={cn(
                            'font-bold',
                            p.adherenceToday >= 80 ? 'text-green-600' :
                            p.adherenceToday >= 50 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {p.adherenceToday}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(p.currentStreak || 0) > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-orange-600 font-bold text-xs">
                            🔥 {p.currentStreak}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={p.isPaused ? 'secondary' : 'default'}>
                          {p.isPaused ? 'Paused' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          p.subscriptionStatus === 'active' ? 'success' :
                          p.subscriptionStatus === 'trial' ? 'warning' : 'secondary'
                        }>
                          {p.subscriptionStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground uppercase">{p.preferredLanguage}</td>
                      <td className="px-4 py-3">
                        {p.complaintsToday?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.complaintsToday.map((c: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-[10px]">{c}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({data.total} patients)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
