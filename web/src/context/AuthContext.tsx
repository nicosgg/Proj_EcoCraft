// State global autentikasi (Context API): pengguna yang login, token, login/logout.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { TOKEN_KEY } from '../api/axiosClient';
import { authApi } from '../api/endpoints';
import type { User } from '../types/data_type';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean; // true saat memeriksa token tersimpan ketika aplikasi dibuka
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      // 401 ditangani oleh event 'ecocraft:unauthorized'
    }
  }, []);

  // Saat aplikasi dibuka: pulihkan sesi dari token di Local Storage
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  // Interceptor Axios memancarkan event ini saat server membalas 401
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('ecocraft:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ecocraft:unauthorized', onUnauthorized);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user: u } = await authApi.register(name, email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(() => ({
    user, isLoading, isAdmin: user?.role === 'admin', login, register, logout, refreshUser,
  }), [user, isLoading, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
