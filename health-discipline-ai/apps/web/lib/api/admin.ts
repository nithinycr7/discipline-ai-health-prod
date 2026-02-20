import { api } from './client';

export const adminApi = {
  getOverview: (token: string) =>
    api.get<any>('/admin/overview', { token }),

  getPatients: (token: string, params?: {
    search?: string;
    status?: string;
    subscription?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.subscription) query.set('subscription', params.subscription);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<any>(`/admin/patients${qs ? `?${qs}` : ''}`, { token });
  },

  getPatient: (id: string, token: string) =>
    api.get<any>(`/admin/patients/${id}`, { token }),

  getPatientStats: (id: string, token: string, days = 30) =>
    api.get<any>(`/admin/patients/${id}/stats?days=${days}`, { token }),

  getPatientCalls: (id: string, token: string, page = 1) =>
    api.get<any>(`/admin/patients/${id}/calls?page=${page}`, { token }),

  getAlerts: (token: string) =>
    api.get<any>('/admin/alerts', { token }),

  getHealthAnalytics: (token: string, days = 30) =>
    api.get<any>(`/admin/analytics/health?days=${days}`, { token }),

  getBusinessAnalytics: (token: string) =>
    api.get<any>('/admin/analytics/business', { token }),

  getOperationsAnalytics: (token: string, days = 30) =>
    api.get<any>(`/admin/analytics/operations?days=${days}`, { token }),
};
