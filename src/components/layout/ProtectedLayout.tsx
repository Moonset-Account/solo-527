'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import AppLayout from './AppLayout';
import { Loading } from '@/components/ui/Feedback';

export default function ProtectedLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'admin' | 'resident';
}) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const auth = await checkAuth();
      if (!auth) {
        router.push('/login');
      }
    };
    initAuth();
  }, [checkAuth, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return <AppLayout role={role}>{children}</AppLayout>;
}
