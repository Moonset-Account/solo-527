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
import { checkOverdueRepairs } from "@/lib/notifications";
import { z } from "zod";
import type { Prisma, RepairStatus } from "@prisma/client";

const createRepairSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.string().min(1),
  reportedById: z.string().uuid(),
  assignedToId: z.string().uuid().optional(),
  deadline: z.string().datetime(),
});

const updateRepairStatusSchema = z.object({
  status: z.enum(["REPORTED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]),
  completedNote: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("repairs", { ...pagination, ...filters });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.RepairWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.status) where.status = filters.status as RepairStatus;
        if (filters.assignedToId) where.assignedToId = filters.assignedToId as string;
        if (filters.severity) where.severity = filters.severity as string;
        if (filters.overdueOnly === "true") {
          where.AND = [
            { deadline: { lt: new Date() } },
            { status: { notIn: ["COMPLETED"] } },
          ];
        }

        const { skip, take } = createPrismaPagination(pagination);

        const [repairs, total] = await Promise.all([
          prisma.repair.findMany({
            where,
            include: {
              project: { select: { id: true, name: true, address: true } },
              reportedBy: { select: { id: true, name: true } },
              assignedTo: { select: { id: true, name: true } },
              photos: true,
            },
            orderBy: [
              { status: "asc" },
              { deadline: "asc" },
              { createdAt: "desc" },
            ],
            skip,
            take,
          }),
          prisma.repair.count({ where }),
        ]);

        const now = new Date();
        const repairsWithOverdue = repairs.map((repair) => ({
          ...repair,
          isOverdue: repair.status !== "COMPLETED" && new Date(repair.deadline) < now,
          daysRemaining: Math.ceil(
            (new Date(repair.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        }));

        return createPaginatedResult(repairsWithOverdue, total, pagination);
      },
      60
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get repairs error:", error);
    return NextResponse.json({ error: "Failed to fetch repairs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createRepairSchema.parse(body);

    const repair = await prisma.repair.create({
      data: {
        projectId: validated.projectId,
        title: validated.title,
        description: validated.description,
        severity: validated.severity,
        status: "REPORTED" as RepairStatus,
        reportedById: validated.reportedById,
        assignedToId: validated.assignedToId,
        deadline: new Date(validated.deadline),
      },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await invalidateCachePattern("repairs:*");
    await invalidateCachePattern(`projects:${validated.projectId}*`);

    return NextResponse.json(repair, { status: 201 });
  } catch (error) {
    console.error("Create repair error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create repair" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Repair ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateRepairStatusSchema.parse(body);

    const repair = await prisma.repair.update({
      where: { id },
      data: {
        status: validated.status as RepairStatus,
        completedNote: validated.completedNote,
        completedAt: validated.status === "COMPLETED" ? new Date() : null,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    await invalidateCachePattern("repairs:*");
    await invalidateCachePattern(`projects:${repair.projectId}*`);

    return NextResponse.json(repair);
  } catch (error) {
    console.error("Update repair error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update repair" }, { status: 500 });
  }
}
