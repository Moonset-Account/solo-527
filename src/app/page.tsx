import { redirect } from 'next/navigation';
import { getSession } from '@/server/lib/auth';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');
  const isAdmin = session.role === 'ADMIN' || session.role === 'ADMIN_LEAD';
  redirect(isAdmin ? '/admin' : '/dashboard');
}
