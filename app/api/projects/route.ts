import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePaginationParams,
  parseSortParams,
  buildFilterParams,
  createPrismaPagination,
  createPaginatedResult,
  withCache,
  invalidateCachePattern,
} from "@/lib/pagination";
import { redisCache } from "@/lib/redis";
import { z } from "zod";
import type { Prisma, ProjectStatus } from "@prisma/client";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().min(1),
  designerId: z.string().uuid(),
  clientId: z.string().uuid(),
  initialBudget: z.number().min(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const sort = parseSortParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("projects", {
    ...pagination,
    ...filters,
    sort,
  });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.ProjectWhereInput = {};

        if (filters.status) where.status = filters.status as ProjectStatus;
        if (filters.designerId) where.designerId = filters.designerId as string;
        if (filters.clientId) where.clientId = filters.clientId as string;
        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search as string, mode: "insensitive" } },
            { address: { contains: filters.search as string, mode: "insensitive" } },
          ];
        }

        const orderBy: Prisma.ProjectOrderByWithRelationInput = sort
          ? { [sort.field]: sort.order }
          : { createdAt: "desc" };

        const { skip, take } = createPrismaPagination(pagination);

        const [projects, total] = await Promise.all([
          prisma.project.findMany({
            where,
            include: {
              designer: { select: { id: true, name: true, avatarUrl: true } },
              client: { select: { id: true, name: true, avatarUrl: true } },
              _count: {
                select: {
                  quotes: true,
                  addons: true,
                  repairs: true,
                  feedbacks: true,
                },
              },
            },
            orderBy,
            skip,
            take,
          }),
          prisma.project.count({ where }),
        ]);

        return createPaginatedResult(projects, total, pagination);
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        address: validated.address,
        designerId: validated.designerId,
        clientId: validated.clientId,
        initialBudget: validated.initialBudget,
        currentBudget: validated.initialBudget,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      },
      include: {
        designer: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });

    await invalidateCachePattern("projects:*");

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
