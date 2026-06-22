import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function Home() {
  const authCookie = cookies().get('auth_user');

  if (authCookie) {
    try {
      const user = JSON.parse(authCookie.value);
      if (user.role === 'admin') {
        redirect('/admin');
      } else {
        redirect('/resident');
      }
    } catch {
      redirect('/login');
    }
  }

  redirect('/login');
}
