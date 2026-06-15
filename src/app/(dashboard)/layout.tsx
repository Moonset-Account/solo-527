import { redirect } from 'next/navigation';
import { getSession } from '@/server/lib/auth';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Topbar } from '@/components/layout/Topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar role={session.role} name={session.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={session} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
