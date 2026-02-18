'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi, VerifyOtpRequest } from '../api/auth';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  timezone: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      authApi.me(savedToken)
        .then((res: any) => setUser(res))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, password?: string) => {
    const response = await authApi.login({ identifier, password });
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const loginWithOtp = useCallback(async (
    firebaseIdToken: string,
    registrationData?: Omit<VerifyOtpRequest, 'firebaseIdToken'>,
  ) => {
    const response = await authApi.verifyOtp({
      firebaseIdToken,
      ...registrationData,
    });
    // If backend says user needs to register first, pass that through
    if (response.needsRegistration) {
      return { user: null, isNewUser: true, needsRegistration: true, phone: response.phone };
    }
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    setToken(response.token);
    setUser(response.user);
    return { user: response.user, isNewUser: response.isNewUser, needsRegistration: false };
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = token || localStorage.getItem('token');
    if (!savedToken) return;
    const res = await authApi.me(savedToken);
    setUser(res);
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  return { user, token, loading, login, loginWithOtp, logout, refreshUser };
}
