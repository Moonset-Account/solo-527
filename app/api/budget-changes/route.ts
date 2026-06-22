import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePaginationParams,
  buildFilterParams,
  createPrismaPagination,
  createPaginatedResult,
  withCache,
} from "@/lib/pagination";
import { redisCache } from "@/lib/redis";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("budget-changes", {
    ...pagination,
    ...filters,
  });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.BudgetChangeWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.changeType) where.changeType = filters.changeType as string;
        if (filters.startDate) {
          where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate as string) };
        }
        if (filters.endDate) {
          where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate as string) };
        }

        const { skip, take } = createPrismaPagination(pagination);

        const [budgetChanges, total, summary] = await Promise.all([
          prisma.budgetChange.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              createdBy: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.budgetChange.count({ where }),
          prisma.budgetChange.aggregate({
            where,
            _sum: { amount: true },
            _count: { id: true },
          }),
        ]);

        const paginatedResult = createPaginatedResult(budgetChanges, total, pagination);

        return {
          ...paginatedResult,
          summary: {
            totalAmount: summary._sum.amount?.toNumber() || 0,
            totalChanges: summary._count.id,
          },
        };
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get budget changes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget changes" },
      { status: 500 }
    );
  }
}
