import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { setCookie } from 'hono/cookie';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = new Hono();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
  role: z.enum(['staff', 'admin', 'coach_supervisor', 'manager']),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role, 
      name: user.name,
      iat: now,
      exp: now + 60 * 60 * 24,
    },
    process.env.JWT_SECRET || 'secret',
    'HS256'
  );

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  });

  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
    },
  });
});

authRoutes.post('/register', authMiddleware, zValidator('json', registerSchema), async (c) => {
  const data = c.req.valid('json');

  const existing = await db.select().from(users).where(eq(users.username, data.username)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: 'Username already exists' }, 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const [newUser] = await db
    .insert(users)
    .values({
      username: data.username,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      phone: data.phone,
      email: data.email,
    })
    .returning();

  return c.json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
  }, 201);
});

authRoutes.post('/logout', authMiddleware, (c) => {
  setCookie(c, 'token', '', { maxAge: 0 });
  return c.json({ message: 'Logged out' });
});

authRoutes.get('/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload');
  const [user] = await db
    .select({ id: users.id, username: users.username, name: users.name, role: users.role, phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);
  return c.json(user);
});

authRoutes.get('/users', authMiddleware, async (c) => {
  const allUsers = await db
    .select({ id: users.id, username: users.username, name: users.name, role: users.role, phone: users.phone, email: users.email, createdAt: users.createdAt })
    .from(users);
  return c.json(allUsers);
});
