import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ──────────────────────────────────────────────────────
// Point this to your deployed NestJS backend
// Production: https://your-api-domain.com
// Local dev:  http://localhost:3001
// ──────────────────────────────────────────────────────
const API_URL = 'https://your-nestjs-backend.com';

// NestJS global prefix from main.ts
const PREFIX = '/api/v1';

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

// ─── Auth ───
// POST /api/v1/auth/login         { identifier, password? }
// POST /api/v1/auth/verify-otp    { firebaseToken }
// POST /api/v1/auth/refresh       { refreshToken }
// GET  /api/v1/auth/me
export const authApi = {
  login: (identifier, password) =>
    api.post(`${PREFIX}/auth/login`, { identifier, password }),
  verifyOtp: (firebaseToken) =>
    api.post(`${PREFIX}/auth/verify-otp`, { firebaseToken }),
  refresh: (refreshToken) =>
    api.post(`${PREFIX}/auth/refresh`, { refreshToken }),
  me: () => api.get(`${PREFIX}/auth/me`),
};

// ─── Patients ───
// GET  /api/v1/patients
// GET  /api/v1/patients/:id
// POST /api/v1/patients             (create)
// PUT  /api/v1/patients/:id         (update)
// POST /api/v1/patients/:id/pause
// POST /api/v1/patients/:id/resume
export const patientsApi = {
  list: () => api.get(`${PREFIX}/patients`),
  get: (id) => api.get(`${PREFIX}/patients/${id}`),
  create: (data) => api.post(`${PREFIX}/patients`, data),
  update: (id, data) => api.put(`${PREFIX}/patients/${id}`, data),
  pause: (id, reason, pausedUntil) =>
    api.post(`${PREFIX}/patients/${id}/pause`, { reason, pausedUntil }),
  resume: (id) => api.post(`${PREFIX}/patients/${id}/resume`),
  // Adherence & Stats (routed via CallsController)
  adherenceToday: (id) =>
    api.get(`${PREFIX}/patients/${id}/adherence/today`),
  adherenceCalendar: (id, month) =>
    api.get(`${PREFIX}/patients/${id}/adherence/calendar`, { params: { month } }),
  stats: (id, days) =>
    api.get(`${PREFIX}/patients/${id}/stats`, { params: { days } }),
};

// ─── Medicines ───
// GET    /api/v1/patients/:pid/medicines
// POST   /api/v1/patients/:pid/medicines
// PUT    /api/v1/patients/:pid/medicines/:mid
// DELETE /api/v1/patients/:pid/medicines/:mid
// GET    /api/v1/patients/:pid/medicines/schedule
export const medicinesApi = {
  list: (patientId) =>
    api.get(`${PREFIX}/patients/${patientId}/medicines`),
  create: (patientId, data) =>
    api.post(`${PREFIX}/patients/${patientId}/medicines`, data),
  update: (patientId, medicineId, data) =>
    api.put(`${PREFIX}/patients/${patientId}/medicines/${medicineId}`, data),
  remove: (patientId, medicineId) =>
    api.delete(`${PREFIX}/patients/${patientId}/medicines/${medicineId}`),
  schedule: (patientId) =>
    api.get(`${PREFIX}/patients/${patientId}/medicines/schedule`),
};

// ─── Calls ───
// GET /api/v1/patients/:pid/calls    ?page=&limit=&startDate=&endDate=
// GET /api/v1/calls/:callId
export const callsApi = {
  list: (patientId, page, limit) =>
    api.get(`${PREFIX}/patients/${patientId}/calls`, { params: { page, limit } }),
  get: (callId) => api.get(`${PREFIX}/calls/${callId}`),
};

// ─── Users ───
// GET /api/v1/users/me
// PUT /api/v1/users/me
export const usersApi = {
  me: () => api.get(`${PREFIX}/users/me`),
  update: (data) => api.put(`${PREFIX}/users/me`, data),
};

export { API_URL };
export default api;
