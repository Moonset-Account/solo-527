import { db } from '../db';
import { eq, and, gte, lte, count, sum, desc, sql } from 'drizzle-orm';
import { exchangeOrders, products, members, memberLevels } from '../db/schema';

export async function getPointCostStatistics(params: {
  startDate: string;
  endDate: string;
  dimension: 'date' | 'product' | 'level';
  filters?: Record<string, any>;
}) {
  const { startDate, endDate, dimension, filters = {} } = params;

  const baseConditions = [
    gte(exchangeOrders.createdAt, new Date(startDate)),
    lte(exchangeOrders.createdAt, new Date(endDate + ' 23:59:59')),
    eq(exchangeOrders.status, 'redeemed'),
  ];

  if (filters.category) {
    baseConditions.push(eq(products.category, filters.category));
  }
  if (filters.level) {
    baseConditions.push(eq(members.levelId, filters.level));
  }

  const whereClause = and(...baseConditions);

  let data: any[] = [];
  let summary;

  if (dimension === 'date') {
    const result = await db
      .select({
        date: sql<string>`DATE(${exchangeOrders.createdAt})`.as('date'),
        orderCount: count(exchangeOrders.id),
        totalPoints: sum(exchangeOrders.totalPoints),
        memberCount: count(sql`DISTINCT ${exchangeOrders.memberId}`),
      })
      .from(exchangeOrders)
      .leftJoin(products, eq(exchangeOrders.productId, products.id))
      .leftJoin(members, eq(exchangeOrders.memberId, members.id))
      .where(whereClause)
      .groupBy(sql`DATE(${exchangeOrders.createdAt})`)
      .orderBy(sql`DATE(${exchangeOrders.createdAt})`);

    data = result.map((r) => ({
      dimension: 'date',
      label: r.date,
      orderCount: Number(r.orderCount || 0),
      totalPoints: Number(r.totalPoints || 0),
      memberCount: Number(r.memberCount || 0),
    }));
  } else if (dimension === 'product') {
    const result = await db
      .select({
        productId: products.id,
        productName: products.name,
        orderCount: count(exchangeOrders.id),
        totalPoints: sum(exchangeOrders.totalPoints),
        memberCount: count(sql`DISTINCT ${exchangeOrders.memberId}`),
      })
      .from(exchangeOrders)
      .leftJoin(products, eq(exchangeOrders.productId, products.id))
      .leftJoin(members, eq(exchangeOrders.memberId, members.id))
      .where(whereClause)
      .groupBy(products.id, products.name)
      .orderBy(desc(sum(exchangeOrders.totalPoints)));

    data = result.map((r) => ({
      dimension: 'product',
      label: r.productName || '未知商品',
      productId: r.productId,
      orderCount: Number(r.orderCount || 0),
      totalPoints: Number(r.totalPoints || 0),
      memberCount: Number(r.memberCount || 0),
    }));
  } else if (dimension === 'level') {
    const result = await db
      .select({
        levelId: memberLevels.id,
        levelName: memberLevels.name,
        orderCount: count(exchangeOrders.id),
        totalPoints: sum(exchangeOrders.totalPoints),
        memberCount: count(sql`DISTINCT ${exchangeOrders.memberId}`),
      })
      .from(exchangeOrders)
      .leftJoin(members, eq(exchangeOrders.memberId, members.id))
      .leftJoin(memberLevels, eq(members.levelId, memberLevels.id))
      .where(whereClause)
      .groupBy(memberLevels.id, memberLevels.name)
      .orderBy(desc(sum(exchangeOrders.totalPoints)));

    data = result.map((r) => ({
      dimension: 'level',
      label: r.levelName || '未知等级',
      levelId: r.levelId,
      orderCount: Number(r.orderCount || 0),
      totalPoints: Number(r.totalPoints || 0),
      memberCount: Number(r.memberCount || 0),
    }));
  }

  const summaryResult = await db
    .select({
      totalOrders: count(exchangeOrders.id),
      totalPoints: sum(exchangeOrders.totalPoints),
      totalMembers: count(sql`DISTINCT ${exchangeOrders.memberId}`),
    })
    .from(exchangeOrders)
    .leftJoin(products, eq(exchangeOrders.productId, products.id))
    .leftJoin(members, eq(exchangeOrders.memberId, members.id))
    .where(whereClause);

  const totalOrders = Number(summaryResult[0]?.totalOrders || 0);
  const totalPoints = Number(summaryResult[0]?.totalPoints || 0);
  const totalMembers = Number(summaryResult[0]?.totalMembers || 0);

  summary = {
    totalOrders,
    totalPoints,
    totalMembers,
    avgPointsPerOrder: totalOrders > 0 ? Math.round(totalPoints / totalOrders) : 0,
  };

  return {
    data,
    summary,
    filters: { startDate, endDate, dimension, ...filters },
  };
}

export async function getExchangeTrend(params: {
  startDate: string;
  endDate: string;
  period: 'day' | 'week' | 'month';
}) {
  const { startDate, endDate, period } = params;

  const result = await db
    .select({
      date: sql<string>`DATE(${exchangeOrders.createdAt})`.as('date'),
      orders: count(exchangeOrders.id),
      points: sum(exchangeOrders.totalPoints),
    })
    .from(exchangeOrders)
    .where(
      and(
        gte(exchangeOrders.createdAt, new Date(startDate)),
        lte(exchangeOrders.createdAt, new Date(endDate + ' 23:59:59'))
      )
    )
    .groupBy(sql`DATE(${exchangeOrders.createdAt})`)
    .orderBy(sql`DATE(${exchangeOrders.createdAt})`);

  const dates: string[] = [];
  const orders: number[] = [];
  const points: number[] = [];

  const dataMap = new Map(result.map((r) => [r.date, r]));

  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    dates.push(dateStr);

    const dayData = dataMap.get(dateStr);
    orders.push(Number(dayData?.orders || 0));
    points.push(Number(dayData?.points || 0));

    current.setDate(current.getDate() + 1);
  }

  return { dates, orders, points };
}
