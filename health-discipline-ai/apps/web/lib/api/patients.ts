import { api } from './client';

export const patientsApi = {
  list: (token: string) => api.get<any>('/patients', { token }),
  get: (id: string, token: string) => api.get<any>(`/patients/${id}`, { token }),
  create: (data: any, token: string) => api.post<any>('/patients', data, { token }),
  update: (id: string, data: any, token: string) => api.put<any>(`/patients/${id}`, data, { token }),
  pause: (id: string, data: any, token: string) => api.post<any>(`/patients/${id}/pause`, data, { token }),
  resume: (id: string, token: string) => api.post<any>(`/patients/${id}/resume`, null, { token }),
  getAdherenceToday: (id: string, token: string) => api.get<any>(`/patients/${id}/adherence/today`, { token }),
  getAdherenceCalendar: (id: string, month: string, token: string) => api.get<any>(`/patients/${id}/adherence/calendar?month=${month}`, { token }),
  testCall: (id: string, token: string) => api.post<any>(`/patients/${id}/test-call`, null, { token }),
};
