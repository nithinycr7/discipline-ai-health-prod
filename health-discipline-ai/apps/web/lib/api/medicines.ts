import { api } from './client';

export const medicinesApi = {
  list: (patientId: string, token: string) => api.get<any>(`/patients/${patientId}/medicines`, { token }),
  create: (patientId: string, data: any, token: string) => api.post<any>(`/patients/${patientId}/medicines`, data, { token }),
  update: (patientId: string, medicineId: string, data: any, token: string) => api.put<any>(`/patients/${patientId}/medicines/${medicineId}`, data, { token }),
  delete: (patientId: string, medicineId: string, token: string) => api.delete<any>(`/patients/${patientId}/medicines/${medicineId}`, { token }),
  search: (query: string, token: string) => api.post<any>('/medicines/search', { query }, { token }),
};
