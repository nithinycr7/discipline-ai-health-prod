import { api } from './client';

export interface LoginRequest {
  identifier: string;
  password?: string;
}

export interface RegisterPayerRequest {
  phone: string;
  name: string;
  location?: string;
  timezone: string;
}

export interface RegisterHospitalRequest {
  email: string;
  password: string;
  hospitalName: string;
  adminName: string;
}

export interface AuthResponse {
  user: any;
  token: string;
  refreshToken: string;
}

export interface VerifyOtpRequest {
  firebaseIdToken: string;
  name?: string;
  location?: string;
  timezone?: string;
}

export interface VerifyOtpResponse extends AuthResponse {
  isNewUser: boolean;
  needsRegistration?: boolean;
  phone?: string;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  verifyOtp: (data: VerifyOtpRequest) => api.post<VerifyOtpResponse>('/auth/verify-otp', data),
  registerPayer: (data: RegisterPayerRequest) => api.post<AuthResponse>('/auth/register/payer', data),
  registerHospital: (data: RegisterHospitalRequest) => api.post<AuthResponse>('/auth/register/hospital', data),
  refresh: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  me: (token: string) => api.get<any>('/auth/me', { token }),
};
