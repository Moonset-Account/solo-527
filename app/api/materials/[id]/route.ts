import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/pagination";
import { createVersionHistory, takeSnapshot } from "@/lib/version-history";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        versionHistory: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { version: "desc" },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...material,
      quantity: material.quantity.toNumber(),
      unitPrice: material.unitPrice.toNumber(),
      totalPrice: material.totalPrice.toNumber(),
    });
  } catch (error) {
    console.error("Get material error:", error);
    return NextResponse.json({ error: "Failed to fetch material" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateMaterialSchema.parse(body);

    const existingMaterial = await prisma.material.findUnique({
      where: { id: params.id },
    });

    if (!existingMaterial) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const material = await prisma.$transaction(async (tx) => {
      const snapshot = takeSnapshot(existingMaterial);
      const newVersion = existingMaterial.version + 1;

      const updatedMaterial = await tx.material.update({
        where: { id: params.id },
        data: {
          name: validated.name,
          category: validated.category,
          specification: validated.specification,
          quantity: validated.quantity,
          unit: validated.unit,
          unitPrice: validated.unitPrice,
          supplier: validated.supplier,
          note: validated.note,
          version: newVersion,
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      await createVersionHistory(
        "Material",
        params.id,
        newVersion,
        snapshot,
        validated.updatedById,
        validated.note || "Material updated",
        tx
      );

      return updatedMaterial;
    });

    await invalidateCachePattern("materials:*");
    await invalidateCachePattern(`projects:${material.projectId}*`);

    return NextResponse.json(material);
  } catch (error) {
    console.error("Update material error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: params.id },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.versionHistory.deleteMany({
        where: {
          entityType: "Material",
          entityId: params.id,
        },
      });

      await tx.material.delete({
        where: { id: params.id },
      });
    });

    await invalidateCachePattern("materials:*");
    await invalidateCachePattern(`projects:${material.projectId}*`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete material error:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
