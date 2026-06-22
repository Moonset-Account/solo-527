import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/pagination";
import { getBudgetSummary, getProjectBudgetHistory } from "@/lib/budget";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  address: z.string().min(1).optional(),
  status: z
    .enum([
      "PENDING_QUOTE",
      "QUOTE_CONFIRMED",
      "IN_PROGRESS",
      "ADDON_PENDING",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  initialBudget: z.number().min(0).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        designer: { select: { id: true, name: true, avatarUrl: true, email: true } },
        client: { select: { id: true, name: true, avatarUrl: true, email: true } },
        quotes: {
          include: {
            items: true,
            confirmedBy: { select: { id: true, name: true } },
          },
          orderBy: { version: "desc" },
        },
        addons: {
          include: {
            proposedBy: { select: { id: true, name: true } },
            confirmedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        materials: {
          orderBy: { createdAt: "desc" },
        },
        photos: {
          orderBy: { takenAt: "desc" },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
        },
        repairs: {
          include: {
            reportedBy: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
            photos: true,
          },
          orderBy: { createdAt: "desc" },
        },
        feedbacks: {
          include: {
            client: { select: { id: true, name: true, avatarUrl: true } },
            resolvedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            quotes: true,
            addons: true,
            materials: true,
            photos: true,
            contracts: true,
            repairs: true,
            feedbacks: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [budgetSummary, budgetHistory] = await Promise.all([
      getBudgetSummary(params.id),
      getProjectBudgetHistory(params.id),
    ]);

    const now = new Date();
    const repairsWithOverdue = project.repairs.map((repair) => ({
      ...repair,
      isOverdue: repair.status !== "COMPLETED" && new Date(repair.deadline) < now,
      daysRemaining: Math.ceil(
        (new Date(repair.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json({
      ...project,
      repairs: repairsWithOverdue,
      budgetSummary,
      budgetHistory,
      initialBudget: project.initialBudget.toNumber(),
      currentBudget: project.currentBudget.toNumber(),
      totalSpent: project.totalSpent.toNumber(),
      budgetVariance: project.budgetVariance.toNumber(),
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.address !== undefined) updateData.address = validated.address;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.initialBudget !== undefined) {
      updateData.initialBudget = validated.initialBudget;
    }
    if (validated.startDate !== undefined) {
      updateData.startDate = validated.startDate
        ? new Date(validated.startDate)
        : null;
    }
    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate ? new Date(validated.endDate) : null;
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        designer: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });

    await invalidateCachePattern("projects:*");

    return NextResponse.json(project);
  } catch (error) {
    console.error("Update project error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.budgetChange.deleteMany({ where: { projectId: params.id } });
      await tx.quoteItem.deleteMany({
        where: { quote: { projectId: params.id } },
      });
      await tx.quote.deleteMany({ where: { projectId: params.id } });
      await tx.addon.deleteMany({ where: { projectId: params.id } });
      await tx.material.deleteMany({ where: { projectId: params.id } });
      await tx.sitePhoto.deleteMany({ where: { projectId: params.id } });
      await tx.contract.deleteMany({ where: { projectId: params.id } });
      await tx.repairPhoto.deleteMany({
        where: { repair: { projectId: params.id } },
      });
      await tx.repair.deleteMany({ where: { projectId: params.id } });
      await tx.feedback.deleteMany({ where: { projectId: params.id } });
      await tx.notification.deleteMany({
        where: {
          OR: [
            { referenceType: "Project", referenceId: params.id },
            { repair: { projectId: params.id } },
          ],
        },
      });
      await tx.versionHistory.deleteMany({
        where: {
          OR: [
            { entityType: "Project", entityId: params.id },
            { entityType: "Quote", entityId: { in: [] } },
          ],
        },
      });
      await tx.project.delete({ where: { id: params.id } });
    });

    await invalidateCachePattern("projects:*");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
