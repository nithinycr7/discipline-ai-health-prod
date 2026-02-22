import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Point to your existing NestJS backend
const API_URL = 'https://your-nestjs-backend.com';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('echocare_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('echocare_token');
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (identifier) => api.post('/auth/login', { identifier }),
  loginWithOtp: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  me: () => api.get('/auth/me'),
};

export const patientsApi = {
  list: () => api.get('/patients'),
  get: (id) => api.get(`/patients/${id}`),
  adherenceToday: (id) => api.get(`/patients/${id}/adherence/today`),
  adherenceCalendar: (id, month) => api.get(`/patients/${id}/adherence/calendar?month=${month}`),
  stats: (id, days) => api.get(`/patients/${id}/stats?days=${days}`),
};

export const medicinesApi = {
  list: (patientId) => api.get(`/patients/${patientId}/medicines`),
};

export const callsApi = {
  list: (patientId, page, limit) => api.get(`/patients/${patientId}/calls?page=${page}&limit=${limit}`),
};

export const usersApi = {
  me: () => api.get('/users/me'),
  update: (data) => api.put('/users/me', data),
};

export { API_URL };
export default api;
