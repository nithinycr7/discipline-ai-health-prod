import { api } from './client';

export const callsApi = {
  list: (patientId: string, params: string, token: string) => api.get<any>(`/patients/${patientId}/calls?${params}`, { token }),
  get: (callId: string, token: string) => api.get<any>(`/calls/${callId}`, { token }),
};
