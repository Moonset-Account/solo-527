import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setAuthToken, getAuthToken, apiFetch } from './api';
import { initOfflineSupport } from './offline';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'supervisor' | 'store_manager' | 'regional_manager';
  store_id: string | null;
  region_id: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initOfflineSupport();
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = getAuthToken();
    if (token) {
      try {
        const data = await apiFetch('/api/auth/me');
        setUser(data.user);
      } catch {
        setAuthToken(null);
      }
    }
    setLoading(false);
  }

  async function login(username: string, password: string) {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    setAuthToken(response.token);
    setUser(response.user);
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
