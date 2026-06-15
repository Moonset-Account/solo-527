import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/lib/auth';

export const metadata: Metadata = { title: '登录 - 周会事项提醒中心' };

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) {
    const target =
      session.role === 'ADMIN' || session.role === 'ADMIN_LEAD'
        ? '/admin'
        : '/dashboard';
    redirect(target);
  }
  return <>{children}</>;
}
