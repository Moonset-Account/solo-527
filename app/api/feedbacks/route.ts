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
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createFeedbackSchema = z.object({
  projectId: z.string().uuid(),
  clientId: z.string().uuid(),
  category: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  content: z.string().min(1),
});

const resolveFeedbackSchema = z.object({
  resolution: z.string().min(1),
  resolvedById: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("feedbacks", { ...pagination, ...filters });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.FeedbackWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.category) where.category = filters.category as string;
        if (filters.clientId) where.clientId = filters.clientId as string;
        if (filters.resolved === "true") where.resolvedAt = { not: null };
        if (filters.resolved === "false") where.resolvedAt = null;

        const { skip, take } = createPrismaPagination(pagination);

        const [feedbacks, total] = await Promise.all([
          prisma.feedback.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              client: { select: { id: true, name: true, avatarUrl: true } },
              resolvedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.feedback.count({ where }),
        ]);

        return createPaginatedResult(feedbacks, total, pagination);
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get feedbacks error:", error);
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createFeedbackSchema.parse(body);

    const feedback = await prisma.feedback.create({
      data: {
        projectId: validated.projectId,
        clientId: validated.clientId,
        category: validated.category,
        rating: validated.rating,
        content: validated.content,
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });

    await invalidateCachePattern("feedbacks:*");
    await invalidateCachePattern(`projects:${validated.projectId}*`);

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Create feedback error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validated = resolveFeedbackSchema.parse(body);

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        resolution: validated.resolution,
        resolvedById: validated.resolvedById,
        resolvedAt: new Date(),
      },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    await invalidateCachePattern("feedbacks:*");
    await invalidateCachePattern(`projects:${feedback.projectId}*`);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Resolve feedback error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to resolve feedback" }, { status: 500 });
  }
}
