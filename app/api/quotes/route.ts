import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePaginationParams,
  buildFilterParams,
  createPrismaPagination,
  createPaginatedResult,
  withCache,
  invalidateCachePattern,
} from "@/lib/pagination";
import { redisCache } from "@/lib/redis";
import { createVersionHistory, takeSnapshot } from "@/lib/version-history";
import { confirmQuote } from "@/lib/budget";
import { z } from "zod";
import type { Prisma, QuoteStatus } from "@prisma/client";

const quoteItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  unitPrice: z.number().min(0),
});

const createQuoteSchema = z.object({
  projectId: z.string().uuid(),
  items: z.array(quoteItemSchema).min(1),
  note: z.string().optional(),
});

const confirmQuoteSchema = z.object({
  confirmedById: z.string().uuid(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("quotes", { ...pagination, ...filters });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.QuoteWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.status) where.status = filters.status as QuoteStatus;

        const { skip, take } = createPrismaPagination(pagination);

        const [quotes, total] = await Promise.all([
          prisma.quote.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              items: true,
              confirmedBy: { select: { id: true, name: true } },
              _count: { select: { versionHistory: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.quote.count({ where }),
        ]);

        return createPaginatedResult(quotes, total, pagination);
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get quotes error:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createQuoteSchema.parse(body);

    const lastQuote = await prisma.quote.findFirst({
      where: { projectId: validated.projectId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const newVersion = lastQuote ? lastQuote.version + 1 : 1;
    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const quote = await prisma.$transaction(async (tx) => {
      const createdQuote = await tx.quote.create({
        data: {
          projectId: validated.projectId,
          version: newVersion,
          totalAmount,
          status: "DRAFT" as QuoteStatus,
          note: validated.note,
          items: {
            create: validated.items.map((item) => ({
              ...item,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          items: true,
          project: { select: { id: true, name: true } },
        },
      });

      const snapshot = takeSnapshot(createdQuote);
      await tx.versionHistory.create({
        data: {
          entityType: "Quote",
          entityId: createdQuote.id,
          version: newVersion,
          snapshot: snapshot as Prisma.JsonValue,
          changedById: "system",
          changeNote: "Quote created",
        },
      });

      return createdQuote;
    });

    await invalidateCachePattern("quotes:*");
    await invalidateCachePattern(`projects:${validated.projectId}*`);

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Create quote error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
