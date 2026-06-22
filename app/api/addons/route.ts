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
import { confirmAddon } from "@/lib/budget";
import { createVersionHistory, takeSnapshot } from "@/lib/version-history";
import { z } from "zod";
import type { Prisma, AddonStatus } from "@prisma/client";

const createAddonSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  reason: z.string().min(1),
  amount: z.number().min(0),
  proposedById: z.string().uuid(),
});

const confirmAddonSchema = z.object({
  confirmedById: z.string().uuid(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("addons", { ...pagination, ...filters });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.AddonWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.status) where.status = filters.status as AddonStatus;

        const { skip, take } = createPrismaPagination(pagination);

        const [addons, total] = await Promise.all([
          prisma.addon.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              proposedBy: { select: { id: true, name: true } },
              confirmedBy: { select: { id: true, name: true } },
              _count: { select: { versionHistory: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.addon.count({ where }),
        ]);

        return createPaginatedResult(addons, total, pagination);
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get addons error:", error);
    return NextResponse.json({ error: "Failed to fetch addons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createAddonSchema.parse(body);

    const addon = await prisma.$transaction(async (tx) => {
      const createdAddon = await tx.addon.create({
        data: {
          projectId: validated.projectId,
          name: validated.name,
          description: validated.description,
          reason: validated.reason,
          amount: validated.amount,
          status: "DRAFT" as AddonStatus,
          proposedById: validated.proposedById,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      const snapshot = takeSnapshot(createdAddon);
      await tx.versionHistory.create({
        data: {
          entityType: "Addon",
          entityId: createdAddon.id,
          version: 1,
          snapshot: snapshot as Prisma.JsonValue,
          changedById: validated.proposedById,
          changeNote: "Addon created",
        },
      });

      return createdAddon;
    });

    await invalidateCachePattern("addons:*");
    await invalidateCachePattern(`projects:${validated.projectId}*`);

    return NextResponse.json(addon, { status: 201 });
  } catch (error) {
    console.error("Create addon error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create addon" }, { status: 500 });
  }
}
