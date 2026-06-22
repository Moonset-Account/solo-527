import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmAddon } from "@/lib/budget";
import { invalidateCachePattern } from "@/lib/pagination";
import { createVersionHistory, takeSnapshot } from "@/lib/version-history";
import { z } from "zod";
import type { AddonStatus } from "@prisma/client";

const confirmAddonSchema = z.object({
  confirmedById: z.string().uuid(),
  note: z.string().optional(),
});

const updateAddonSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  reason: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  status: z.enum(["DRAFT", "PENDING_CONFIRMATION", "CONFIRMED", "REJECTED"]).optional(),
  updatedById: z.string().uuid(),
  note: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const addon = await prisma.addon.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, address: true } },
        proposedBy: { select: { id: true, name: true } },
        confirmedBy: { select: { id: true, name: true } },
        versionHistory: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { version: "desc" },
        },
      },
    });

    if (!addon) {
      return NextResponse.json({ error: "Addon not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...addon,
      amount: addon.amount.toNumber(),
    });
  } catch (error) {
    console.error("Get addon error:", error);
    return NextResponse.json({ error: "Failed to fetch addon" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "confirm") {
    try {
      const body = await request.json();
      const validated = confirmAddonSchema.parse(body);

      const addon = await confirmAddon(params.id, validated.confirmedById, validated.note);

      await invalidateCachePattern("addons:*");
      await invalidateCachePattern(`projects:${addon.projectId}*`);
      await invalidateCachePattern("budget-changes:*");

      return NextResponse.json(addon);
    } catch (error) {
      console.error("Confirm addon error:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to confirm addon" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateAddonSchema.parse(body);

    const existingAddon = await prisma.addon.findUnique({
      where: { id: params.id },
    });

    if (!existingAddon) {
      return NextResponse.json({ error: "Addon not found" }, { status: 404 });
    }

    const snapshot = takeSnapshot(existingAddon);
    const newVersion = existingAddon.version + 1;

    const updateData: Record<string, unknown> = { version: newVersion };
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.reason !== undefined) updateData.reason = validated.reason;
    if (validated.amount !== undefined) updateData.amount = validated.amount;
    if (validated.status !== undefined) updateData.status = validated.status as AddonStatus;

    const addon = await prisma.$transaction(async (tx) => {
      const updatedAddon = await tx.addon.update({
        where: { id: params.id },
        data: updateData,
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      await tx.versionHistory.create({
        data: {
          entityType: "Addon",
          entityId: params.id,
          version: newVersion,
          snapshot: snapshot as any,
          changedById: validated.updatedById,
          changeNote: validated.note || "Addon updated",
        },
      });

      return updatedAddon;
    });

    await invalidateCachePattern("addons:*");
    await invalidateCachePattern(`projects:${addon.projectId}*`);

    return NextResponse.json(addon);
  } catch (error) {
    console.error("Update addon error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update addon" }, { status: 500 });
  }
}
