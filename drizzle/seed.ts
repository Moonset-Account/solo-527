import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import {
  mockUsers,
  mockBrands,
  mockMembers,
  mockSubscriptions,
  mockTodos,
  mockExceptions,
  mockOrders,
  mockRetentionAlerts,
  mockApiLogs
} from '../src/lib/mock-data';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/podcast_delivery';

const pool = new pg.Pool({ connectionString, max: 5 });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('Seeding database...');

  try {
    await db.insert(schema.users).values(
      mockUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as 'host' | 'operator',
        avatarUrl: u.avatarUrl,
        createdAt: new Date(u.createdAt)
      }))
    );
    console.log(`Inserted ${mockUsers.length} users`);

    await db.insert(schema.brands).values(
      mockBrands.map((b) => ({
        id: b.id,
        name: b.name,
        hostId: b.hostId,
        createdAt: new Date(b.createdAt)
      }))
    );
    console.log(`Inserted ${mockBrands.length} brands`);

    await db.insert(schema.members).values(
      mockMembers.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        createdAt: new Date(m.createdAt)
      }))
    );
    console.log(`Inserted ${mockMembers.length} members`);

    await db.insert(schema.memberSubscriptions).values(
      mockSubscriptions.map((s) => ({
        id: s.id,
        memberId: s.memberId,
        brandId: s.brandId,
        planType: s.planType,
        materialAuthStatus: s.materialAuthStatus,
        invoiceCycle: s.invoiceCycle,
        subscriptionStatus: s.subscriptionStatus,
        startDate: s.startDate,
        endDate: s.endDate,
        createdAt: new Date(s.createdAt)
      }))
    );
    console.log(`Inserted ${mockSubscriptions.length} subscriptions`);

    await db.insert(schema.todoItems).values(
      mockTodos.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        priority: t.priority,
        materialAuthStatus: t.materialAuthStatus || null,
        invoiceCycle: t.invoiceCycle || null,
        subscriptionStatus: t.subscriptionStatus || null,
        relatedBrandId: t.relatedBrandId || null,
        relatedMemberId: t.relatedMemberId || null,
        dueDate: new Date(t.dueDate),
        status: t.status,
        assigneeId: t.assigneeId,
        createdAt: new Date(t.createdAt)
      }))
    );
    console.log(`Inserted ${mockTodos.length} todos`);

    await db.insert(schema.exceptions).values(
      mockExceptions.map((e) => ({
        id: e.id,
        brandId: e.brandId,
        title: e.title,
        description: e.description,
        category: e.category,
        status: e.status,
        result: e.result,
        remark: e.remark,
        hostId: e.hostId,
        resolvedAt: e.resolvedAt ? new Date(e.resolvedAt) : null,
        createdAt: new Date(e.createdAt)
      }))
    );
    console.log(`Inserted ${mockExceptions.length} exceptions`);

    await db.insert(schema.orders).values(
      mockOrders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        memberId: o.memberId,
        brandId: o.brandId,
        amount: o.amount,
        status: o.status,
        paidAt: o.paidAt ? new Date(o.paidAt) : null,
        createdAt: new Date(o.createdAt)
      }))
    );
    console.log(`Inserted ${mockOrders.length} orders`);

    const allDeliveryNodes = mockOrders.flatMap((o) =>
      o.deliveryNodes.map((node) => ({
        id: node.id,
        orderId: o.id,
        name: node.name,
        status: node.status,
        assigneeId: node.assigneeId,
        completedAt: node.completedAt ? new Date(node.completedAt) : null,
        deadline: new Date(node.deadline),
        sortOrder: node.sortOrder
      }))
    );
    await db.insert(schema.deliveryNodes).values(allDeliveryNodes);
    console.log(`Inserted ${allDeliveryNodes.length} delivery nodes`);

    await db.insert(schema.retentionAlerts).values(
      mockRetentionAlerts.map((a) => ({
        id: a.id,
        brandId: a.brandId,
        metric: a.metric,
        currentValue: a.currentValue,
        threshold: a.threshold,
        ownerId: a.ownerId,
        notifiedAt: a.notifiedAt ? new Date(a.notifiedAt) : null,
        status: a.status,
        createdAt: new Date(a.createdAt)
      }))
    );
    console.log(`Inserted ${mockRetentionAlerts.length} retention alerts`);

    await db.insert(schema.apiLogs).values(
      mockApiLogs.map((l) => ({
        id: l.id,
        endpoint: l.endpoint,
        method: l.method,
        success: l.success,
        errorMessage: l.errorMessage,
        lastRetryAt: l.lastRetryAt ? new Date(l.lastRetryAt) : null,
        retryCount: l.retryCount,
        requestedAt: new Date(l.requestedAt)
      }))
    );
    console.log(`Inserted ${mockApiLogs.length} API logs`);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
