import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ──────────────────────────────────────────────────────
// Resolved from app.json extra → env → fallback
// ──────────────────────────────────────────────────────
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://discipline-ai-api-337728476024.us-central1.run.app';

const PREFIX = '/api/v1';

const STORAGE_KEYS = {
  TOKEN: 'cocarely_token',
  REFRESH_TOKEN: 'cocarely_refresh_token',
};

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

// ─── Attach access token ───
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Token refresh on 401 ───
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Skip refresh for auth endpoints and already-retried requests
    if (
      err.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(err);
    }

    originalRequest._retry = true;

    try {
      // Deduplicate concurrent refresh attempts
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) throw new Error('No refresh token');

          const res = await axios.post(`${API_URL}${PREFIX}/auth/refresh`, { refreshToken });
          const { token, refreshToken: newRefresh } = res.data;

          await AsyncStorage.multiSet([
            [STORAGE_KEYS.TOKEN, token],
            ...(newRefresh ? [[STORAGE_KEYS.REFRESH_TOKEN, newRefresh]] : []),
          ]);

          return token;
        })();
      }

      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch {
      // Refresh failed — clear tokens, force re-login
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
      return Promise.reject(err);
    } finally {
      refreshPromise = null;
    }
  }
);

// ─── Auth ───
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
export const patientsApi = {
  list: () => api.get(`${PREFIX}/patients`),
  get: (id) => api.get(`${PREFIX}/patients/${id}`),
  create: (data) => api.post(`${PREFIX}/patients`, data),
  update: (id, data) => api.put(`${PREFIX}/patients/${id}`, data),
  pause: (id, reason, pausedUntil) =>
    api.post(`${PREFIX}/patients/${id}/pause`, { reason, pausedUntil }),
  resume: (id) => api.post(`${PREFIX}/patients/${id}/resume`),
  adherenceToday: (id) =>
    api.get(`${PREFIX}/patients/${id}/adherence/today`),
  adherenceCalendar: (id, month) =>
    api.get(`${PREFIX}/patients/${id}/adherence/calendar`, { params: { month } }),
  stats: (id, days) =>
    api.get(`${PREFIX}/patients/${id}/stats`, { params: { days } }),
};

// ─── Medicines ───
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
export const callsApi = {
  list: (patientId, page, limit) =>
    api.get(`${PREFIX}/patients/${patientId}/calls`, { params: { page, limit } }),
  get: (callId) => api.get(`${PREFIX}/calls/${callId}`),
};

// ─── Users ───
export const usersApi = {
  me: () => api.get(`${PREFIX}/users/me`),
  update: (data) => api.put(`${PREFIX}/users/me`, data),
};

export { API_URL, STORAGE_KEYS };
export default api;
