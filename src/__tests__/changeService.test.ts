/**
 * @jest-environment node
 */

import { ChangeService } from "@/lib/services/changeService";
import { PurchaseService } from "@/lib/services/purchaseService";
import { ChangeStatus, ConfirmationType, Role } from "@/generated/prisma";

const mockTx = {
  confirmationRecord: { create: jest.fn() },
  changeRequest: { update: jest.fn(), findUnique: jest.fn() },
  changeVersion: { create: jest.fn() },
  schedule: { findMany: jest.fn(), update: jest.fn() },
  purchaseOrder: { create: jest.fn() },
};

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    changeRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    changeVersion: {
      create: jest.fn(),
    },
    confirmationRecord: {
      create: jest.fn(),
    },
    schedule: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    purchaseOrder: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    purchaseItem: {
      create: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockTx)),
  },
}));

const prisma = require("@/lib/prisma").default;

describe("家庭装修变更确认系统 - 验收测试", () => {
  let ownerUser: any;
  let pmUser: any;
  let designerUser: any;
  let financeUser: any;
  let project: any;

  beforeEach(() => {
    jest.clearAllMocks();

    ownerUser = {
      id: "owner-1",
      name: "业主张三",
      email: "owner@test.com",
      role: Role.OWNER,
    };

    pmUser = {
      id: "pm-1",
      name: "项目经理李四",
      email: "pm@test.com",
      role: Role.PROJECT_MANAGER,
    };

    designerUser = {
      id: "designer-1",
      name: "设计师王五",
      email: "designer@test.com",
      role: Role.DESIGNER,
    };

    financeUser = {
      id: "finance-1",
      name: "财务赵六",
      email: "finance@test.com",
      role: Role.FINANCE,
    };

    project = {
      id: "project-1",
      name: "阳光花园装修项目",
      address: "北京市朝阳区",
      ownerId: ownerUser.id,
    };
  });

  describe("场景一：新增变更", () => {
    it("应该能够创建新的变更请求并保存版本", async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(project);
      (prisma.changeRequest.create as jest.Mock).mockResolvedValue({
        id: "change-1",
        projectId: project.id,
        title: "厨房瓷砖更换",
        version: 1,
        status: ChangeStatus.DRAFT,
        createdById: pmUser.id,
        originalPlan: "普通白色瓷砖 300x300",
        newMaterial: "大理石纹理瓷砖 600x600",
        priceDifference: 5000,
        scheduleImpact: 2,
        versions: [],
        confirmations: [],
      });
      (prisma.changeVersion.create as jest.Mock).mockResolvedValue({
        id: "version-1",
        changeRequestId: "change-1",
        version: 1,
      });

      const result = await ChangeService.createChange(pmUser.id, {
        projectId: project.id,
        title: "厨房瓷砖更换",
        originalPlan: "普通白色瓷砖 300x300",
        newMaterial: "大理石纹理瓷砖 600x600",
        priceDifference: 5000,
        scheduleImpact: 2,
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("厨房瓷砖更换");
      expect(result.version).toBe(1);
      expect(result.status).toBe(ChangeStatus.DRAFT);
      expect(prisma.changeVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 1,
            originalPlan: "普通白色瓷砖 300x300",
            newMaterial: "大理石纹理瓷砖 600x600",
          }),
        })
      );
    });

    it("应该能够提交变更进行确认并锁定排期", async () => {
      const change = {
        id: "change-1",
        projectId: project.id,
        title: "厨房瓷砖更换",
        version: 1,
        status: ChangeStatus.DRAFT,
        createdById: pmUser.id,
        project,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      (prisma.changeRequest.update as jest.Mock).mockResolvedValue({
        ...change,
        status: ChangeStatus.PENDING_CONFIRMATION,
        isLocked: true,
      });
      (prisma.schedule.findMany as jest.Mock).mockResolvedValue([
        { id: "schedule-1", task: "泥工施工", isLocked: false },
      ]);

      const result = await ChangeService.submitForConfirmation(
        "change-1",
        pmUser.id
      );

      expect(result.status).toBe(ChangeStatus.PENDING_CONFIRMATION);
      expect(result.isLocked).toBe(true);
      expect(prisma.schedule.update).toHaveBeenCalled();
    });
  });

  describe("场景二：业主拒绝", () => {
    it("业主应该能够拒绝变更并解锁排期", async () => {
      const change = {
        id: "change-1",
        projectId: project.id,
        title: "厨房瓷砖更换",
        version: 1,
        status: ChangeStatus.PENDING_CONFIRMATION,
        isLocked: true,
        project: { ...project, owner: ownerUser },
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(ownerUser);

      mockTx.confirmationRecord.create.mockResolvedValue({ id: "conf-1" });
      mockTx.changeRequest.update.mockResolvedValue({
        ...change,
        status: ChangeStatus.REJECTED,
        isLocked: false,
      });
      mockTx.schedule.findMany.mockResolvedValue([{ id: "schedule-1" }]);

      const result = await ChangeService.rejectChange(
        "change-1",
        ownerUser.id,
        "价格太高，不同意更换"
      );

      expect(mockTx.confirmationRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: ConfirmationType.REJECT,
            comment: "价格太高，不同意更换",
            confirmedById: ownerUser.id,
          }),
        })
      );
      expect(mockTx.schedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isLocked: false,
            changeRequestId: null,
          }),
        })
      );
    });

    it("非业主用户不能拒绝变更", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.PENDING_CONFIRMATION,
        project: { ...project, owner: ownerUser },
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(pmUser);

      await expect(
        ChangeService.rejectChange("change-1", pmUser.id)
      ).rejects.toThrow("Only project owner can reject changes");
    });
  });

  describe("场景三：二次确认", () => {
    it("被拒绝的变更应该可以修改后重新提交（二次确认）", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.REJECTED,
        version: 1,
        isLocked: false,
        originalPlan: "普通白色瓷砖",
        newMaterial: "大理石瓷砖",
        priceDifference: 5000,
        scheduleImpact: 2,
        sitePhotoUrl: null,
        drawingNote: null,
        managerNote: null,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      mockTx.changeRequest.update.mockResolvedValue({
        ...change,
        version: 2,
        status: ChangeStatus.DRAFT,
        priceDifference: 3000,
      });
      mockTx.changeVersion.create.mockResolvedValue({ id: "v2" });

      const result = await ChangeService.updateChange(
        "change-1",
        pmUser.id,
        { priceDifference: 3000, managerNote: "已更换为更经济的方案" },
        Role.PROJECT_MANAGER
      );

      expect(mockTx.changeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
            status: ChangeStatus.DRAFT,
          }),
        })
      );
      expect(mockTx.changeVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 2,
          }),
        })
      );
    });

    it("设计师在锁定状态下应该只能修改图纸说明", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.PENDING_CONFIRMATION,
        isLocked: true,
        version: 1,
        originalPlan: "原方案",
        newMaterial: "新材料",
        priceDifference: 1000,
        scheduleImpact: 1,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      (prisma.changeRequest.update as jest.Mock).mockResolvedValue({
        ...change,
        drawingNote: "图纸已更新，见附件",
      });

      const result = await ChangeService.updateChange(
        "change-1",
        designerUser.id,
        { drawingNote: "图纸已更新，见附件" },
        Role.DESIGNER
      );

      expect(prisma.changeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { drawingNote: "图纸已更新，见附件" },
        })
      );
    });

    it("项目经理在锁定状态下应该只能补充说明", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.PENDING_CONFIRMATION,
        isLocked: true,
        version: 1,
        originalPlan: "原方案",
        newMaterial: "新材料",
        priceDifference: 1000,
        scheduleImpact: 1,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      (prisma.changeRequest.update as jest.Mock).mockResolvedValue({
        ...change,
        managerNote: "现场已确认可以施工",
      });

      const result = await ChangeService.updateChange(
        "change-1",
        pmUser.id,
        { managerNote: "现场已确认可以施工" },
        Role.PROJECT_MANAGER
      );

      expect(prisma.changeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { managerNote: "现场已确认可以施工" },
        })
      );
    });

    it("已确认的变更应该可以撤回并恢复旧方案", async () => {
      const versions = [
        {
          id: "v2",
          version: 2,
          originalPlan: "原方案v2",
          newMaterial: "新方案v2",
          priceDifference: 3000,
          scheduleImpact: 1,
        },
        {
          id: "v1",
          version: 1,
          originalPlan: "原方案v1",
          newMaterial: "新方案v1",
          priceDifference: 5000,
          scheduleImpact: 2,
        },
      ];

      const change = {
        id: "change-1",
        status: ChangeStatus.CONFIRMED,
        version: 2,
        isLocked: true,
        purchaseOrder: null,
        versions,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      mockTx.confirmationRecord.create.mockResolvedValue({ id: "conf-2" });
      mockTx.changeRequest.update.mockResolvedValue({
        ...change,
        status: ChangeStatus.WITHDRAWN,
        version: 1,
        originalPlan: "原方案v1",
      });
      mockTx.schedule.findMany.mockResolvedValue([]);

      const result = await ChangeService.withdrawChange(
        "change-1",
        ownerUser.id,
        "需要重新考虑"
      );

      expect(mockTx.confirmationRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: ConfirmationType.WITHDRAW,
          }),
        })
      );
      expect(mockTx.changeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ChangeStatus.WITHDRAWN,
            version: 1,
            originalPlan: "原方案v1",
          }),
        })
      );
    });
  });

  describe("场景四：采购单生成", () => {
    it("只有确认后的变更才能生成采购单", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.CONFIRMED,
        purchaseOrder: null,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      mockTx.purchaseOrder.create.mockResolvedValue({
        id: "po-1",
        orderNumber: "PO-123456",
        totalAmount: 8000,
      });
      mockTx.changeRequest.update.mockResolvedValue({
        ...change,
        status: ChangeStatus.PURCHASED,
      });

      const result = await PurchaseService.createPurchaseOrder(
        pmUser.id,
        Role.PROJECT_MANAGER,
        {
          changeRequestId: "change-1",
          items: [
            { name: "大理石瓷砖 600x600", quantity: 100, unitPrice: 80 },
          ],
        }
      );

      expect(mockTx.purchaseOrder.create).toHaveBeenCalled();
      expect(mockTx.changeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: ChangeStatus.PURCHASED },
        })
      );
    });

    it("未确认的变更不能生成采购单", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.PENDING_CONFIRMATION,
        purchaseOrder: null,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);

      await expect(
        PurchaseService.createPurchaseOrder(
          pmUser.id,
          Role.PROJECT_MANAGER,
          {
            changeRequestId: "change-1",
            items: [{ name: "瓷砖", quantity: 100, unitPrice: 80 }],
          }
        )
      ).rejects.toThrow("Only confirmed changes can create purchase orders");
    });

    it("已经有采购单的变更不能重复创建", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.CONFIRMED,
        purchaseOrder: { id: "po-1" },
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);

      await expect(
        PurchaseService.createPurchaseOrder(
          pmUser.id,
          Role.PROJECT_MANAGER,
          {
            changeRequestId: "change-1",
            items: [{ name: "瓷砖", quantity: 100, unitPrice: 80 }],
          }
        )
      ).rejects.toThrow("Purchase order already exists for this change");
    });

    it("普通角色不能创建采购单", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.CONFIRMED,
        purchaseOrder: null,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);

      await expect(
        PurchaseService.createPurchaseOrder(
          ownerUser.id,
          Role.OWNER,
          {
            changeRequestId: "change-1",
            items: [{ name: "瓷砖", quantity: 100, unitPrice: 80 }],
          }
        )
      ).rejects.toThrow("Only project manager or finance can create purchase orders");
    });

    it("应该能正确计算报价差异", async () => {
      const originalItems = [
        { name: "普通瓷砖", quantity: 100, unitPrice: 50 },
      ];
      const newItems = [
        { name: "大理石瓷砖", quantity: 100, unitPrice: 80 },
      ];

      const result = await PurchaseService.calculatePriceDifference(
        originalItems,
        newItems
      );

      expect(result.originalTotal).toBe(5000);
      expect(result.newTotal).toBe(8000);
      expect(result.difference).toBe(3000);
      expect(result.percentage).toBe(60);
    });
  });

  describe("角色权限验证", () => {
    it("财务角色只能查看和备注，不能修改核心内容", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.PENDING_CONFIRMATION,
        isLocked: true,
        version: 1,
        originalPlan: "原方案",
        newMaterial: "新材料",
        priceDifference: 1000,
        scheduleImpact: 1,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);
      (prisma.changeRequest.update as jest.Mock).mockResolvedValue({
        ...change,
        financeNote: "差价已确认，符合预算",
      });

      const result = await ChangeService.updateChange(
        "change-1",
        financeUser.id,
        { financeNote: "差价已确认，符合预算" },
        Role.FINANCE
      );

      expect(prisma.changeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { financeNote: "差价已确认，符合预算" },
        })
      );
    });

    it("财务角色不能修改核心变更内容", async () => {
      const change = {
        id: "change-1",
        status: ChangeStatus.PENDING_CONFIRMATION,
        isLocked: true,
        version: 1,
        originalPlan: "原方案",
        newMaterial: "新材料",
        priceDifference: 1000,
        scheduleImpact: 1,
      };

      (prisma.changeRequest.findUnique as jest.Mock).mockResolvedValue(change);

      await expect(
        ChangeService.updateChange(
          "change-1",
          financeUser.id,
          { priceDifference: 2000 },
          Role.FINANCE
        )
      ).rejects.toThrow("Change is locked and cannot be modified");
    });
  });

  describe("本周待确认列表", () => {
    it("应该按周过滤待业主确认的变更", async () => {
      const mockChanges = [
        {
          id: "change-1",
          title: "变更1",
          status: ChangeStatus.PENDING_CONFIRMATION,
          createdAt: new Date(),
          project,
          createdBy: pmUser,
          versions: [{ version: 1 }],
          confirmations: [],
        },
      ];

      (prisma.changeRequest.findMany as jest.Mock).mockResolvedValue(mockChanges);

      const result = await ChangeService.getPendingChangesForWeek(ownerUser.id);

      expect(result).toHaveLength(1);
      expect(prisma.changeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ChangeStatus.PENDING_CONFIRMATION,
            project: { ownerId: ownerUser.id },
          }),
        })
      );
    });
  });
});
