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
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createMaterialSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  specification: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  unitPrice: z.number().min(0),
  supplier: z.string().optional(),
  note: z.string().optional(),
  createdById: z.string().uuid(),
});

const updateMaterialSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  specification: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  supplier: z.string().optional(),
  note: z.string().optional(),
  updatedById: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("materials", { ...pagination, ...filters });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.MaterialWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.category) where.category = filters.category as string;

        const { skip, take } = createPrismaPagination(pagination);

        const [materials, total] = await Promise.all([
          prisma.material.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              createdBy: { select: { id: true, name: true } },
              _count: { select: { versionHistory: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.material.count({ where }),
        ]);

        return createPaginatedResult(materials, total, pagination);
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get materials error:", error);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createMaterialSchema.parse(body);

    const material = await prisma.$transaction(async (tx) => {
      const createdMaterial = await tx.material.create({
        data: {
          projectId: validated.projectId,
          name: validated.name,
          category: validated.category,
          specification: validated.specification,
          quantity: validated.quantity,
          unit: validated.unit,
          unitPrice: validated.unitPrice,
          supplier: validated.supplier,
          note: validated.note,
          createdById: validated.createdById,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      const snapshot = takeSnapshot(createdMaterial);
      await createVersionHistory(
        "Material",
        createdMaterial.id,
        1,
        snapshot,
        validated.createdById,
        validated.note || "Material created",
        tx
      );

      return createdMaterial;
    });

    await invalidateCachePattern("materials:*");
    await invalidateCachePattern(`projects:${validated.projectId}*`);

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Create material error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
  }
}
