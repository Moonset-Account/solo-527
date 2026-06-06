import { cookies } from 'next/headers';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  image?: string | null;
}

export interface Session {
  user: User;
}

export async function auth(): Promise<Session | null> {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('user');
  
  if (!userCookie?.value) {
    return null;
  }

  try {
    const user = JSON.parse(userCookie.value) as User;
    return { user };
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<User | null> {
  const demoUsers: User[] = [
    {
      id: 'demo-admin-1',
      name: '管理员',
      email: 'admin@demo.com',
      role: 'admin',
    },
    {
      id: 'demo-client-1',
      name: '张经理',
      email: 'client@demo.com',
      role: 'client',
    },
  ];

  const user = demoUsers.find((u) => u.email === email);
  if (!user) return null;

  if (password === 'admin123' || password === 'client123' || password === 'demo') {
    return user;
  }

  return null;
}

export async function signOut() {
  const cookieStore = cookies();
  cookieStore.delete('user');
}

export const handlers = {
  GET: async () => new Response('Not implemented'),
  POST: async () => new Response('Not implemented'),
};
