import prisma from "@/lib/prisma";
import { ChangeStatus, ConfirmationType, Role } from "@/generated/prisma";
import { z } from "zod";

export const createChangeSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  originalPlan: z.string().min(1),
  newMaterial: z.string().min(1),
  priceDifference: z.number().default(0),
  scheduleImpact: z.number().default(0),
  sitePhotoUrl: z.string().optional(),
  projectManagerId: z.string().optional(),
});

export const updateChangeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  originalPlan: z.string().min(1).optional(),
  newMaterial: z.string().min(1).optional(),
  priceDifference: z.number().optional(),
  scheduleImpact: z.number().optional(),
  sitePhotoUrl: z.string().optional(),
  drawingNote: z.string().optional(),
  managerNote: z.string().optional(),
  financeNote: z.string().optional(),
});

export type CreateChangeInput = z.infer<typeof createChangeSchema>;
export type UpdateChangeInput = z.infer<typeof updateChangeSchema>;

export class ChangeService {
  static async createChange(userId: string, input: CreateChangeInput) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const change = await prisma.changeRequest.create({
      data: {
        ...input,
        createdById: userId,
        status: ChangeStatus.DRAFT,
      },
      include: {
        versions: true,
        confirmations: true,
      },
    });

    await prisma.changeVersion.create({
      data: {
        changeRequestId: change.id,
        version: 1,
        originalPlan: input.originalPlan,
        newMaterial: input.newMaterial,
        priceDifference: input.priceDifference,
        scheduleImpact: input.scheduleImpact,
        sitePhotoUrl: input.sitePhotoUrl,
        createdById: userId,
      },
    });

    return change;
  }

  static async submitForConfirmation(changeId: string, userId: string) {
    const change = await prisma.changeRequest.findUnique({
      where: { id: changeId },
      include: { project: true },
    });

    if (!change) {
      throw new Error("Change request not found");
    }

    if (change.status !== ChangeStatus.DRAFT) {
      throw new Error("Only draft changes can be submitted");
    }

    const updated = await prisma.changeRequest.update({
      where: { id: changeId },
      data: {
        status: ChangeStatus.PENDING_CONFIRMATION,
        isLocked: true,
      },
      include: {
        project: true,
        createdBy: true,
        projectManager: true,
        versions: true,
        confirmations: true,
      },
    });

    const schedules = await prisma.schedule.findMany({
      where: {
        projectId: change.projectId,
        isLocked: false,
      },
    });

    for (const schedule of schedules) {
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          isLocked: true,
          lockedById: userId,
          changeRequestId: changeId,
        },
      });
    }

    return updated;
  }

  static async confirmChange(changeId: string, userId: string, comment?: string) {
    const change = await prisma.changeRequest.findUnique({
      where: { id: changeId },
      include: { project: { include: { owner: true } } },
    });

    if (!change) {
      throw new Error("Change request not found");
    }

    if (change.status !== ChangeStatus.PENDING_CONFIRMATION) {
      throw new Error("Only pending changes can be confirmed");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== Role.OWNER && change.project.ownerId !== userId)) {
      throw new Error("Only project owner can confirm changes");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const confirmation = await tx.confirmationRecord.create({
        data: {
          changeRequestId: changeId,
          confirmedById: userId,
          type: ConfirmationType.CONFIRM,
          comment,
          signatureHash: `sig_${Date.now()}_${userId}`,
        },
      });

      const changeUpdate = await tx.changeRequest.update({
        where: { id: changeId },
        data: {
          status: ChangeStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
        include: {
          project: true,
          createdBy: true,
          projectManager: true,
          versions: true,
          confirmations: true,
        },
      });

      return changeUpdate;
    });

    return updated;
  }

  static async rejectChange(changeId: string, userId: string, comment?: string) {
    const change = await prisma.changeRequest.findUnique({
      where: { id: changeId },
      include: { project: { include: { owner: true } } },
    });

    if (!change) {
      throw new Error("Change request not found");
    }

    if (change.status !== ChangeStatus.PENDING_CONFIRMATION) {
      throw new Error("Only pending changes can be rejected");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== Role.OWNER && change.project.ownerId !== userId)) {
      throw new Error("Only project owner can reject changes");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.confirmationRecord.create({
        data: {
          changeRequestId: changeId,
          confirmedById: userId,
          type: ConfirmationType.REJECT,
          comment,
        },
      });

      const changeUpdate = await tx.changeRequest.update({
        where: { id: changeId },
        data: {
          status: ChangeStatus.REJECTED,
          isLocked: false,
        },
        include: {
          project: true,
          createdBy: true,
          projectManager: true,
          versions: true,
          confirmations: true,
        },
      });

      const schedules = await tx.schedule.findMany({
        where: { changeRequestId: changeId },
      });

      for (const schedule of schedules) {
        await tx.schedule.update({
          where: { id: schedule.id },
          data: {
            isLocked: false,
            lockedById: null,
            changeRequestId: null,
          },
        });
      }

      return changeUpdate;
    });

    return updated;
  }

  static async withdrawChange(changeId: string, userId: string, comment?: string) {
    const change = await prisma.changeRequest.findUnique({
      where: { id: changeId },
      include: { versions: { orderBy: { version: "desc" }, take: 2 } },
    });

    if (!change) {
      throw new Error("Change request not found");
    }

    if (change.status !== ChangeStatus.CONFIRMED) {
      throw new Error("Only confirmed changes can be withdrawn");
    }

    if (change.purchaseOrder) {
      throw new Error("Cannot withdraw change that has purchase order");
    }

    const previousVersion = change.versions[1] || change.versions[0];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.confirmationRecord.create({
        data: {
          changeRequestId: changeId,
          confirmedById: userId,
          type: ConfirmationType.WITHDRAW,
          comment,
        },
      });

      const changeUpdate = await tx.changeRequest.update({
        where: { id: changeId },
        data: {
          status: ChangeStatus.WITHDRAWN,
          isLocked: false,
          version: previousVersion.version,
          originalPlan: previousVersion.originalPlan,
          newMaterial: previousVersion.newMaterial,
          priceDifference: previousVersion.priceDifference,
          scheduleImpact: previousVersion.scheduleImpact,
          sitePhotoUrl: previousVersion.sitePhotoUrl,
          drawingNote: previousVersion.drawingNote,
          managerNote: previousVersion.managerNote,
        },
        include: {
          project: true,
          createdBy: true,
          projectManager: true,
          versions: true,
          confirmations: true,
        },
      });

      const schedules = await tx.schedule.findMany({
        where: { changeRequestId: changeId },
      });

      for (const schedule of schedules) {
        await tx.schedule.update({
          where: { id: schedule.id },
          data: {
            isLocked: false,
            lockedById: null,
            changeRequestId: null,
          },
        });
      }

      return changeUpdate;
    });

    return updated;
  }

  static async updateChange(
    changeId: string,
    userId: string,
    input: UpdateChangeInput,
    userRole: Role
  ) {
    const change = await prisma.changeRequest.findUnique({
      where: { id: changeId },
    });

    if (!change) {
      throw new Error("Change request not found");
    }

    if (change.isLocked && change.status === ChangeStatus.PENDING_CONFIRMATION) {
      if (userRole === Role.DESIGNER && input.drawingNote) {
        return prisma.changeRequest.update({
          where: { id: changeId },
          data: { drawingNote: input.drawingNote },
        });
      }
      if (userRole === Role.PROJECT_MANAGER && input.managerNote) {
        return prisma.changeRequest.update({
          where: { id: changeId },
          data: { managerNote: input.managerNote },
        });
      }
      if (userRole === Role.FINANCE && input.financeNote) {
        return prisma.changeRequest.update({
          where: { id: changeId },
          data: { financeNote: input.financeNote },
        });
      }
      throw new Error("Change is locked and cannot be modified");
    }

    if (change.status !== ChangeStatus.DRAFT && change.status !== ChangeStatus.REJECTED) {
      throw new Error("Only draft or rejected changes can be updated");
    }

    const newVersion = change.version + 1;

    const updated = await prisma.$transaction(async (tx) => {
      const changeUpdate = await tx.changeRequest.update({
        where: { id: changeId },
        data: {
          ...input,
          version: newVersion,
          status: ChangeStatus.DRAFT,
        },
        include: {
          versions: true,
        },
      });

      await tx.changeVersion.create({
        data: {
          changeRequestId: changeId,
          version: newVersion,
          originalPlan: input.originalPlan || change.originalPlan,
          newMaterial: input.newMaterial || change.newMaterial,
          priceDifference: input.priceDifference ?? change.priceDifference.toNumber(),
          scheduleImpact: input.scheduleImpact ?? change.scheduleImpact,
          sitePhotoUrl: input.sitePhotoUrl || change.sitePhotoUrl,
          drawingNote: input.drawingNote || change.drawingNote,
          managerNote: input.managerNote || change.managerNote,
          createdById: userId,
        },
      });

      return changeUpdate;
    });

    return updated;
  }

  static async getPendingChangesForWeek(ownerId?: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const where: any = {
      status: ChangeStatus.PENDING_CONFIRMATION,
      createdAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    };

    if (ownerId) {
      where.project = {
        ownerId,
      };
    }

    return prisma.changeRequest.findMany({
      where,
      include: {
        project: true,
        createdBy: true,
        projectManager: true,
        versions: { orderBy: { version: "desc" }, take: 1 },
        confirmations: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getChangeById(changeId: string) {
    return prisma.changeRequest.findUnique({
      where: { id: changeId },
      include: {
        project: { include: { owner: true } },
        createdBy: true,
        projectManager: true,
        versions: { orderBy: { version: "desc" } },
        confirmations: { include: { confirmedBy: true }, orderBy: { createdAt: "desc" } },
        purchaseOrder: { include: { items: true } },
        attachments: true,
        schedule: true,
      },
    });
  }

  static async canCreatePurchaseOrder(changeId: string) {
    const change = await prisma.changeRequest.findUnique({
      where: { id: changeId },
    });

    if (!change) return false;
    if (change.status !== ChangeStatus.CONFIRMED) return false;
    if (change.purchaseOrder) return false;

    return true;
  }
}
