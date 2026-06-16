import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, subscriptions, membershipPlans } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const app = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
});

app.post('/login', async (c) => {
  const body = await c.req.json();
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues }, 400);
  }

  const { email } = result.data;

  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userList[0];

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user, token: `mock-token-${user.id}` });
});

app.get('/me', async (c) => {
  const userIdParam = c.req.query('userId');
  const authHeader = c.req.header('Authorization');

  let userId: number = 1;

  if (userIdParam) {
    userId = parseInt(userIdParam, 10);
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const userIdMatch = token.match(/mock-token-(\d+)/);
    if (userIdMatch) {
      userId = parseInt(userIdMatch[1], 10);
    }
  }

  const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userList[0];

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const subscriptionList = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      status: subscriptions.status,
      autoRenew: subscriptions.autoRenew,
      owner: subscriptions.owner,
      renewCount: subscriptions.renewCount,
      canceledAt: subscriptions.canceledAt,
      cancelReason: subscriptions.cancelReason,
      createdAt: subscriptions.createdAt,
      planName: membershipPlans.name,
      planPrice: membershipPlans.price,
      planFeatures: membershipPlans.features,
    })
    .from(subscriptions)
    .leftJoin(membershipPlans, eq(subscriptions.planId, membershipPlans.id))
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const latestSubscription = subscriptionList[0];

  let membershipStatus: 'none' | 'active' | 'expired' = 'none';
  let activeSubscription: typeof latestSubscription | undefined = undefined;

  if (latestSubscription) {
    const now = new Date();
    const endDate = new Date(latestSubscription.endDate);
    
    if (latestSubscription.status === 'active' && endDate > now) {
      membershipStatus = 'active';
      activeSubscription = latestSubscription;
    } else {
      membershipStatus = 'expired';
    }
  }

  return c.json({
    user,
    activeSubscription,
    membershipStatus,
  });
});

export default app;
