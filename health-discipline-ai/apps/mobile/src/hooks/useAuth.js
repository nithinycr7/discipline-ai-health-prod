import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, STORAGE_KEYS } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        const res = await authApi.me();
        setUser(res.data);
      }
    } catch {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (phone) => {
    const res = await authApi.login(phone);
    const { token, refreshToken, user: userData } = res.data;

    const pairs = [[STORAGE_KEYS.TOKEN, token]];
    if (refreshToken) pairs.push([STORAGE_KEYS.REFRESH_TOKEN, refreshToken]);
    await AsyncStorage.multiSet(pairs);

    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      // If refresh fails, let the 401 interceptor handle token rotation
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
