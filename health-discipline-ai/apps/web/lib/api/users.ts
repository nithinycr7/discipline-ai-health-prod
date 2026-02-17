import { api } from './client';

export const usersApi = {
  getMe: (token: string) => api.get<any>('/users/me', { token }),
  updateMe: (data: any, token: string) => api.put<any>('/users/me', data, { token }),
};
