import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'agent' | 'admin' | 'superadmin';
  status: string;
  avatar: string | null;
  company_id: number | null;
  company?: { id: number; name: string; plan: string } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; password_confirmation: string; company_name: string }) => Promise<AuthUser>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data ?? res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string, remember = false) => {
    const res = await api.post('/auth/login', { email, password, remember });
    const u = res.data.data ?? res.data;
    setUser(u);
    return u;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    company_name: string;
  }) => {
    const res = await api.post('/auth/register', data);
    const u = res.data.data ?? res.data;
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
