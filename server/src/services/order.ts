import { db } from '../db';
import { eq, and, desc, gte, lte, like, count, sql } from 'drizzle-orm';
import { exchangeOrders, products, members, memberLevels, pointTransactions, redeemRecords } from '../db/schema';
import { generateOrderNo, generateRedeemCode } from '../utils/generator';
import { getProductById } from './common';

export async function createExchangeOrder(memberId: string, productId: string, quantity: number = 1) {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('商品不存在');
  }

  if (product.status !== 'active') {
    throw new Error('商品已下架');
  }

  if (product.stock < quantity) {
    throw new Error('库存不足');
  }

  const member = await db.select().from(members).where(eq(members.id, memberId));
  if (member.length === 0) {
    throw new Error('会员不存在');
  }

  const totalPoints = product.pointsPrice * quantity;
  if (member[0].points < totalPoints) {
    throw new Error('积分不足');
  }

  return await db.transaction(async (tx) => {
    const orderNo = generateOrderNo();
    const redeemCode = generateRedeemCode();

    const orderResult = await tx
      .insert(exchangeOrders)
      .values({
        orderNo,
        memberId,
        productId,
        quantity,
        totalPoints,
        status: 'pending',
        redeemCode,
      })
      .returning();

    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${quantity}`,
        soldCount: sql`${products.soldCount} + ${quantity}`,
      })
      .where(eq(products.id, productId));

    await tx
      .update(members)
      .set({ points: sql`${members.points} - ${totalPoints}` })
      .where(eq(members.id, memberId));

    await tx.insert(pointTransactions).values({
      memberId,
      points: -totalPoints,
      type: 'spend',
      reason: `兑换商品: ${product.name}`,
      refId: orderResult[0].id,
    });

    return orderResult[0];
  });
}

export async function getMyOrders(memberId: string, params: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const { page = 1, pageSize = 10, status } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(exchangeOrders.memberId, memberId)];
  if (status) conditions.push(eq(exchangeOrders.status, status));

  const whereClause = and(...conditions);

  const [itemsResult, countResult] = await Promise.all([
    db
      .select()
      .from(exchangeOrders)
      .leftJoin(products, eq(exchangeOrders.productId, products.id))
      .where(whereClause)
      .orderBy(desc(exchangeOrders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(exchangeOrders).where(whereClause),
  ]);

  const items = itemsResult.map((row) => ({
    ...row.exchange_orders,
    product: row.products || undefined,
  }));

  return {
    items,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
  };
}

export async function getOrderDetail(orderId: string) {
  const result = await db
    .select()
    .from(exchangeOrders)
    .leftJoin(products, eq(exchangeOrders.productId, products.id))
    .leftJoin(members, eq(exchangeOrders.memberId, members.id))
    .leftJoin(memberLevels, eq(members.levelId, memberLevels.id))
    .where(eq(exchangeOrders.id, orderId));

  if (result.length === 0) return null;

  const row = result[0];
  return {
    ...row.exchange_orders,
    product: row.products || undefined,
    member: row.members
      ? {
          ...row.members,
          level: row.member_levels || undefined,
        }
      : undefined,
  };
}

export async function getAdminOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, status, keyword, startDate, endDate } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (status) conditions.push(eq(exchangeOrders.status, status));
  if (keyword) {
    conditions.push(
      sql`(${exchangeOrders.orderNo} ILIKE ${`%${keyword}%`} OR ${members.nickname} ILIKE ${`%${keyword}%`} OR ${members.phone} ILIKE ${`%${keyword}%`})`
    );
  }
  if (startDate) conditions.push(gte(exchangeOrders.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(exchangeOrders.createdAt, new Date(endDate + ' 23:59:59')));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
    .select()
    .from(exchangeOrders)
    .leftJoin(products, eq(exchangeOrders.productId, products.id))
    .leftJoin(members, eq(exchangeOrders.memberId, members.id));

  const [itemsResult, countResult] = await Promise.all([
    baseQuery
      .where(whereClause)
      .orderBy(desc(exchangeOrders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(exchangeOrders).where(whereClause),
  ]);

  const items = itemsResult.map((row) => ({
    ...row.exchange_orders,
    product: row.products || undefined,
    member: row.members || undefined,
  }));

  return {
    items,
    total: Number(countResult[0]?.count || 0),
    page,
    pageSize,
    filters: { status, keyword, startDate, endDate },
  };
}

export async function redeemOrder(orderId: string, adminUserId: string, redeemCode?: string, remark?: string) {
  const order = await db.select().from(exchangeOrders).where(eq(exchangeOrders.id, orderId));
  if (order.length === 0) {
    throw new Error('订单不存在');
  }

  if (order[0].status === 'redeemed') {
    throw new Error('订单已核销');
  }

  if (order[0].status !== 'pending') {
    throw new Error('订单状态不可核销');
  }

  if (redeemCode && order[0].redeemCode !== redeemCode) {
    throw new Error('核销码不匹配');
  }

  return await db.transaction(async (tx) => {
    const result = await tx
      .update(exchangeOrders)
      .set({
        status: 'redeemed',
        redeemedAt: new Date(),
      })
      .where(eq(exchangeOrders.id, orderId))
      .returning();

    await tx.insert(redeemRecords).values({
      orderId,
      adminUserId,
      remark,
    });

    return result[0];
  });
}

export async function getOrderByRedeemCode(redeemCode: string) {
  const result = await db
    .select()
    .from(exchangeOrders)
    .leftJoin(products, eq(exchangeOrders.productId, products.id))
    .leftJoin(members, eq(exchangeOrders.memberId, members.id))
    .where(eq(exchangeOrders.redeemCode, redeemCode));

  if (result.length === 0) return null;

  const row = result[0];
  return {
    ...row.exchange_orders,
    product: row.products || undefined,
    member: row.members || undefined,
  };
}
