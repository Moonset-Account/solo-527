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

const createPhotoSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().min(1),
  location: z.string().optional(),
  note: z.string().optional(),
  uploadedById: z.string().uuid(),
});

const updatePhotoSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  updatedById: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const filters = buildFilterParams(searchParams);

  const cacheKey = redisCache.generateCacheKey("photos", { ...pagination, ...filters });

  try {
    const result = await withCache(
      cacheKey,
      async () => {
        const where: Prisma.SitePhotoWhereInput = {};

        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.category) where.category = filters.category as string;

        const { skip, take } = createPrismaPagination(pagination);

        const [photos, total] = await Promise.all([
          prisma.sitePhoto.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              uploadedBy: { select: { id: true, name: true } },
              _count: { select: { versionHistory: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.sitePhoto.count({ where }),
        ]);

        return createPaginatedResult(photos, total, pagination);
      },
      300
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get photos error:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createPhotoSchema.parse(body);

    const photo = await prisma.$transaction(async (tx) => {
      const createdPhoto = await tx.sitePhoto.create({
        data: {
          projectId: validated.projectId,
          name: validated.name,
          category: validated.category,
          description: validated.description,
          url: validated.url,
          location: validated.location,
          note: validated.note,
          uploadedById: validated.uploadedById,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      const snapshot = takeSnapshot(createdPhoto);
      await createVersionHistory(
        "SitePhoto",
        createdPhoto.id,
        1,
        snapshot,
        validated.uploadedById,
        validated.note || "Photo uploaded",
        tx
      );

      return createdPhoto;
    });

    await invalidateCachePattern("photos:*");
    await invalidateCachePattern(`projects:${validated.projectId}*`);

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Create photo error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create photo" }, { status: 500 });
  }
}
