import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getCurrentUserId } from '../lib/api';
import type { User, Subscription } from '../lib/types';

type MembershipStatus = 'none' | 'active' | 'expired' | 'loading';

interface AuthContextType {
  user: User | null;
  activeSubscription: Subscription | null;
  membershipStatus: MembershipStatus;
  login: (userId: number) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('loading');

  const refreshAuth = async () => {
    setMembershipStatus('loading');
    try {
      const data = await authApi.getCurrentUser();
      setUser(data.user);
      setActiveSubscription(data.activeSubscription || null);
      setMembershipStatus(data.membershipStatus);
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      setUser(null);
      setActiveSubscription(null);
      setMembershipStatus('none');
    }
  };

  const login = async (userId: number) => {
    try {
      const data = await authApi.login(userId);
      setUser(data.user);
      setActiveSubscription(data.activeSubscription || null);
      setMembershipStatus(data.membershipStatus);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setActiveSubscription(null);
    setMembershipStatus('none');
  };

  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      refreshAuth();
    } else {
      setMembershipStatus('none');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeSubscription,
        membershipStatus,
        login,
        logout,
        refreshAuth,
      }}
    >
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
