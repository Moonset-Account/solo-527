import prisma from "@/lib/prisma";
import { ChangeStatus, Role } from "@/generated/prisma";
import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  changeRequestId: z.string(),
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export class PurchaseService {
  static async createPurchaseOrder(
    userId: string,
    userRole: Role,
    input: CreatePurchaseOrderInput
  ) {
    const change = await prisma.changeRequest.findUnique({
      where: { id: input.changeRequestId },
      include: { purchaseOrder: true },
    });

    if (!change) {
      throw new Error("Change request not found");
    }

    if (change.status !== ChangeStatus.CONFIRMED) {
      throw new Error("Only confirmed changes can create purchase orders");
    }

    if (change.purchaseOrder) {
      throw new Error("Purchase order already exists for this change");
    }

    if (userRole !== Role.PROJECT_MANAGER && userRole !== Role.FINANCE) {
      throw new Error("Only project manager or finance can create purchase orders");
    }

    const itemsWithTotal = input.items.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);

    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          changeRequestId: input.changeRequestId,
          orderNumber,
          totalAmount,
          createdById: userId,
          items: {
            create: itemsWithTotal,
          },
        },
        include: {
          items: true,
          changeRequest: true,
          createdBy: true,
        },
      });

      await tx.changeRequest.update({
        where: { id: input.changeRequestId },
        data: { status: ChangeStatus.PURCHASED },
      });

      return po;
    });

    return purchaseOrder;
  }

  static async getPurchaseOrderById(purchaseOrderId: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: true,
        changeRequest: {
          include: {
            project: true,
          },
        },
        createdBy: true,
      },
    });
  }

  static async getPurchaseOrdersByProject(projectId: string) {
    return prisma.purchaseOrder.findMany({
      where: {
        changeRequest: {
          projectId,
        },
      },
      include: {
        items: true,
        changeRequest: true,
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async calculatePriceDifference(
    originalItems: Array<{ name: string; quantity: number; unitPrice: number }>,
    newItems: Array<{ name: string; quantity: number; unitPrice: number }>
  ) {
    const originalTotal = originalItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const newTotal = newItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return {
      originalTotal,
      newTotal,
      difference: newTotal - originalTotal,
      percentage: originalTotal > 0 ? ((newTotal - originalTotal) / originalTotal) * 100 : 0,
    };
  }
}
