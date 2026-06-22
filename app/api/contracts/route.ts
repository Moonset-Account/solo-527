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
import type { Prisma, ContractStatus } from "@prisma/client";

const createContractSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().min(1),
  amount: z.number().min(0),
  note: z.string().optional(),
  uploadedById: z.string().uuid(),
});

const updateContractSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  note: z.string().optional(),
  updatedById: z.string().uuid(),
});

const signContractSchema = z.object({
  signedById: z.string().uuid(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("contracts", { ...pagination, ...filters });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.ContractWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.status) where.status = filters.status as ContractStatus;
        if (filters.type) where.type = filters.type as string;

        const { skip, take } = createPrismaPagination(pagination);

        const [contracts, total] = await Promise.all([
          prisma.contract.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              uploadedBy: { select: { id: true, name: true } },
              signedBy: { select: { id: true, name: true } },
              _count: { select: { versionHistory: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.contract.count({ where }),
        ]);

        return createPaginatedResult(contracts, total, pagination);
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get contracts error:", error);
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createContractSchema.parse(body);

    const contract = await prisma.$transaction(async (tx) => {
      const createdContract = await tx.contract.create({
        data: {
          projectId: validated.projectId,
          name: validated.name,
          type: validated.type,
          description: validated.description,
          url: validated.url,
          amount: validated.amount,
          status: "DRAFT" as ContractStatus,
          note: validated.note,
          uploadedById: validated.uploadedById,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      const snapshot = takeSnapshot(createdContract);
      await createVersionHistory(
        "Contract",
        createdContract.id,
        1,
        snapshot,
        validated.uploadedById,
        validated.note || "Contract uploaded",
        tx
      );

      return createdContract;
    });

    await invalidateCachePattern("contracts:*");
    await invalidateCachePattern(`projects:${validated.projectId}*`);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Create contract error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
