'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '@/lib/store';
import { mockUsers } from '@/lib/mock-data';
import { roleCanAccessRoute } from '@/lib/supabase/auth-guard';
import type { UserRole } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

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
      let id = localStorage.getItem('auth_user_id');
      if (!id) {
        const match = document.cookie.match(/demo_uid=([^;]+)/);
        if (match) id = decodeURIComponent(match[1]);
      }
      if (id && !currentUser) {
        const u = mockUsers.find((x) => x.id === id);
        if (u) login(u.email);
        else {
          const emailMatch = document.cookie.match(/demo_email=([^;]+)/);
          if (emailMatch) {
            const email = decodeURIComponent(emailMatch[1]);
            const u2 = mockUsers.find((x) => x.email === email);
            if (u2) login(u2.email);
          }
        }
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

  const { allowed } = roleCanAccessRoute(currentUser.role as UserRole, pathname);

  if (!allowed) {
    return (
      <div className="h-screen flex overflow-hidden bg-slate-50">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
          <main className="flex-1 overflow-auto scrollbar-thin p-6 flex items-center justify-center">
            <div className="card max-w-md p-8 text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                当前角色无访问权限
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                该页面属于受限业务页面，需更高权限方可访问。请返回工作台或切换账号。
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary"
              >
                返回工作台
              </button>
            </div>
          </main>
        </div>
      </div>
    );
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
