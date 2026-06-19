'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '@/lib/store';
import { mockUsers } from '@/lib/mock-data';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAppStore((s) => s.currentUser);
  const login = useAppStore((s) => s.login);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const id = localStorage.getItem('auth_user_id');
      if (id && !currentUser) {
        const u = mockUsers.find((x) => x.id === id);
        if (u) login(u.email);
      }
    } catch {
      /* empty */
    }
  }, [currentUser, login]);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser && pathname !== '/login') {
      router.replace('/login');
    }
    if (currentUser && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [hydrated, currentUser, pathname, router]);

  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className="flex-1 overflow-auto scrollbar-thin p-6">{children}</main>
      </div>
    </div>
  );
}
