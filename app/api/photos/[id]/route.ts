import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/pagination";
import { createVersionHistory, takeSnapshot } from "@/lib/version-history";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updatePhotoSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  updatedById: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await prisma.sitePhoto.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
        versionHistory: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { version: "desc" },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Get photo error:", error);
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updatePhotoSchema.parse(body);

    const existingPhoto = await prisma.sitePhoto.findUnique({
      where: { id: params.id },
    });

    if (!existingPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const photo = await prisma.$transaction(async (tx) => {
      const snapshot = takeSnapshot(existingPhoto);
      const newVersion = existingPhoto.version + 1;

      const updatedPhoto = await tx.sitePhoto.update({
        where: { id: params.id },
        data: {
          name: validated.name,
          category: validated.category,
          description: validated.description,
          location: validated.location,
          note: validated.note,
          version: newVersion,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      await createVersionHistory(
        "SitePhoto",
        params.id,
        newVersion,
        snapshot,
        validated.updatedById,
        validated.note || "Photo updated",
        tx
      );

      return updatedPhoto;
    });

    await invalidateCachePattern("photos:*");
    await invalidateCachePattern(`projects:${photo.projectId}*`);

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Update photo error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await prisma.sitePhoto.findUnique({
      where: { id: params.id },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.versionHistory.deleteMany({
        where: {
          entityType: "SitePhoto",
          entityId: params.id,
        },
      });

      await tx.sitePhoto.delete({
        where: { id: params.id },
      });
    });

    await invalidateCachePattern("photos:*");
    await invalidateCachePattern(`projects:${photo.projectId}*`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
