import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiErrorMessage, setAuthFailureHandler } from '@/api/client';
import { authApi, userApi } from '@/api/endpoints';
import { tokenStore } from '@/api/tokenStore';
import type { LanguageCode, User } from '@/api/types';
import { clearLocalData } from '@/db';
import { setLanguage as persistLanguage } from '@/i18n';

const GUEST_KEY = 'agrimate.guest';

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  language?: string;
  location?: string;
  role?: 'FARMER' | 'AGRONOMIST';
}

interface AuthState {
  user: User | null;
  isGuest: boolean;
  /** True once a real account is signed in (not a guest). */
  isAuthenticated: boolean;
  initializing: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(async () => {
    await tokenStore.clear();
    await AsyncStorage.removeItem(GUEST_KEY);
    try {
      clearLocalData(); // wipe cached farms/crops/scans for the next user
    } catch {
      /* db may not be initialized yet */
    }
    setUser(null);
    setIsGuest(false);
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => {
      void logout();
    });
  }, [logout]);

  // Restore session (real account or guest) on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStore.getAccess();
        if (token) {
          const me = await userApi.me();
          setUser(me);
          await persistLanguage(me.language as LanguageCode);
        } else if ((await AsyncStorage.getItem(GUEST_KEY)) === '1') {
          setIsGuest(true);
        }
      } catch {
        await tokenStore.clear();
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const res = await authApi.login(identifier, password);
      await tokenStore.save(res.accessToken, res.refreshToken);
      await AsyncStorage.removeItem(GUEST_KEY);
      setIsGuest(false);
      setUser(res.user);
      await persistLanguage(res.user.language as LanguageCode);
    } catch (e) {
      throw new Error(apiErrorMessage(e));
    }
  }, []);

  const register = useCallback(async (body: RegisterBody) => {
    try {
      const res = await authApi.register(body);
      await tokenStore.save(res.accessToken, res.refreshToken);
      await AsyncStorage.removeItem(GUEST_KEY);
      setIsGuest(false);
      setUser(res.user);
      await persistLanguage(res.user.language as LanguageCode);
    } catch (e) {
      throw new Error(apiErrorMessage(e));
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    setUser(null);
    setIsGuest(true);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await userApi.me();
    setUser(me);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isGuest,
      isAuthenticated: !!user,
      initializing,
      login,
      register,
      continueAsGuest,
      logout,
      refreshUser,
      setUser,
    }),
    [user, isGuest, initializing, login, register, continueAsGuest, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
