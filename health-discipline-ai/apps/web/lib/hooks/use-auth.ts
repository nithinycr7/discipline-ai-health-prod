'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

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

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, loading, login, logout };
}
