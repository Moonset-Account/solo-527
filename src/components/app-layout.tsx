import { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { UserProvider } from '@/app/context/user-context';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
    </UserProvider>
  );
}
