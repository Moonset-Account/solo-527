'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="lg:hidden">
            <MobileHeader />
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}

function MobileHeader() {
  return (
    <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-display font-bold">梨园剧社</span>
      </div>
    </div>
  );
}
