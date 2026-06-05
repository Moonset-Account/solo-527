import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

type UserRole = 'SUPER_ADMIN' | 'COMMITTEE' | 'DIRECTOR' | 'ACTOR' | 'TICKET_STAFF' | 'USER';

declare module 'next-auth' {
  interface User {
    role: UserRole;
    studentId?: string;
    department?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      studentId?: string | null;
      department?: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role: UserRole;
    studentId?: string;
    department?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.studentId = user.studentId;
        token.department = user.department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.studentId = token.studentId;
        session.user.department = token.department;
        session.user.id = token.sub!;
      }
      return session;
    },
  },
});
