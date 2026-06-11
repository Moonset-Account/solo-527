import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { createToken, hashPassword, comparePassword } from '../utils/auth';
import { authMiddleware, type Env } from '../middleware/auth';

const app = new Hono<Env>();

app.post(
  '/register',
  zValidator(
    'json',
    z.object({
      email: z.string().email('邮箱格式不正确'),
      phone: z.string().optional(),
      password: z.string().min(6, '密码至少6位'),
      fullName: z.string().min(2, '姓名至少2个字符'),
    })
  ),
  async (c) => {
    const data = c.req.valid('json');
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.email, data.email)));

    if (existing.length > 0) {
      return c.json({ error: '该邮箱已被注册' }, 400);
    }

    const hashed = await hashPassword(data.password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        phone: data.phone,
        passwordHash: hashed,
        fullName: data.fullName,
        role: 'audience',
      })
      .returning();

    const token = await createToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.fullName,
    });

    return c.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        phone: newUser.phone,
        isVerified: newUser.isVerified,
      },
    });
  }
);

app.post(
  '/login',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  ),
  async (c) => {
    const data = c.req.valid('json');
    const [user] = await db.select().from(users).where(eq(users.email, data.email));

    if (!user) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        realName: user.realName,
        idCardNumber: user.idCardNumber,
        gender: user.gender,
      },
    });
  }
);

app.get('/me', authMiddleware, async (c) => {
  const authUser = c.get('user');
  if (!authUser) return c.json({ error: '未登录' }, 401);

  const [user] = await db.select().from(users).where(eq(users.id, authUser.userId));

  if (!user) return c.json({ error: '用户不存在' }, 404);

  return c.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    realName: user.realName,
    idCardNumber: user.idCardNumber,
    gender: user.gender,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  });
});

app.put(
  '/me',
  authMiddleware,
  zValidator(
    'json',
    z.object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(),
      realName: z.string().optional(),
      idCardNumber: z.string().optional(),
      gender: z.enum(['male', 'female', 'other']).optional(),
    })
  ),
  async (c) => {
    const authUser = c.get('user');
    const data = c.req.valid('json');

    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.phone) updateData.phone = data.phone;
    if (data.avatar) updateData.avatar = data.avatar;
    if (data.realName) updateData.realName = data.realName;
    if (data.idCardNumber) updateData.idCardNumber = data.idCardNumber;
    if (data.gender) updateData.gender = data.gender;

    if (data.realName && data.idCardNumber) {
      updateData.isVerified = true;
    }

    const [updated] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, authUser!.userId))
      .returning();

    return c.json({
      id: updated.id,
      fullName: updated.fullName,
      phone: updated.phone,
      realName: updated.realName,
      idCardNumber: updated.idCardNumber,
      gender: updated.gender,
      isVerified: updated.isVerified,
    });
  }
);

export default app;
