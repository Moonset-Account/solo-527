import { Router } from "express";
import { asyncHandler, AppError } from "../middleware/error";
import { validateRequest } from "../middleware/validate";
import { SafetyStockCreateSchema } from "@qinghe/shared";
import type { SafetyStockDrilldown, DelayRecord } from "@qinghe/shared";
import { SafetyStockModel } from "../models/SafetyStock";
import { InventoryModel } from "../models/Inventory";
import { TransferModel } from "../models/Transfer";
import { recordStatusChange } from "../models/StatusHistory";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      pageSize = "20",
      status,
      sku,
      category,
      responsiblePerson,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (sku) {
      filter.$or = [
        { sku: { $regex: sku, $options: "i" } },
        { skuName: { $regex: sku, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (responsiblePerson) filter.responsiblePerson = responsiblePerson;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await SafetyStockModel.countDocuments(filter);
    const data = await SafetyStockModel.find(filter)
      .sort({ status: 1, nextReviewDate: 1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: { data, total, page: pageNum, pageSize: size },
    });
  })
);

router.get(
  "/stats/summary",
  asyncHandler(async (_req, res) => {
    const stats = await SafetyStockModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {
      NORMAL: 0,
      WARNING: 0,
      CRITICAL: 0,
    };
    stats.forEach((s) => {
      result[s._id as string] = s.count;
    });

    res.json({ success: true, data: result });
  })
);

router.get(
  "/:id/drilldown",
  asyncHandler(async (req, res) => {
    const safetyStock = await SafetyStockModel.findById(req.params.id);
    if (!safetyStock) {
      throw new AppError("安全库存记录不存在", 404);
    }

    const inventoryList = await InventoryModel.find(
      { sku: safetyStock.sku },
      {
        batchId: 1,
        batchNo: 1,
        locationCode: 1,
        quantity: 1,
        availableQuantity: 1,
        expiryDate: 1,
      }
    ).sort({ expiryDate: 1 });

    const pendingTransfers = await TransferModel.find(
      {
        sku: safetyStock.sku,
        status: { $in: ["PENDING", "APPROVED", "DELAYED"] },
      },
      {
        _id: 1,
        transferNo: 1,
        quantity: 1,
        expectedDate: 1,
        status: 1,
        applicant: 1,
      }
    ).sort({ expectedDate: 1 });

    const completedTransfers = await TransferModel.find(
      { sku: safetyStock.sku },
      null,
      { sort: { createdAt: -1 }, limit: 50 }
    );

    const delays: DelayRecord[] = completedTransfers
      .filter((t) => t.actualDate && t.expectedDate && t.actualDate > t.expectedDate)
      .map((t) => {
        const msPerDay = 24 * 60 * 60 * 1000;
        const delayDays = Math.ceil(
          (new Date(t.actualDate!).getTime() - new Date(t.expectedDate).getTime()) /
            msPerDay
        );
        const handlingTime =
          t.handlingStartTime && t.handlingEndTime
            ? Math.round(
                (new Date(t.handlingEndTime).getTime() -
                  new Date(t.handlingStartTime).getTime()) /
                  60000
              )
            : undefined;

        return {
          transferNo: t.transferNo,
          plannedDate: t.plannedDate,
          actualDate: t.actualDate,
          delayDays,
          reason: t.delayReason || "未填写",
          reasonCategory:
            (t.delayReasonCategory as DelayRecord["reasonCategory"]) || "OTHER",
          handler: t.handler || "未指定",
          handlingTime,
          remark: t.remark,
        };
      });

    const leadTimeStats = {
      averageLeadTime:
        delays.length > 0
          ? Math.round(
              delays.reduce((sum, d) => sum + d.delayDays, 0) / delays.length
            )
          : 0,
      delayedCount: delays.length,
      delays,
    };

    const stockoutHistory: SafetyStockDrilldown["stockoutHistory"] = [];
    if (safetyStock.minQuantity > 0 && safetyStock.currentStock < safetyStock.minQuantity) {
      stockoutHistory.push({
        date: new Date(),
        gapQuantity: safetyStock.minQuantity - safetyStock.currentStock,
        reason: "当前库存低于安全库存线",
      });
    }

    const drilldown: SafetyStockDrilldown = {
      safetyStock,
      inventoryList: inventoryList.map((i) => ({
        batchId: i.batchId,
        batchNo: i.batchNo,
        locationCode: i.locationCode,
        quantity: i.quantity,
        expiryDate: i.expiryDate,
      })),
      pendingTransfers: pendingTransfers.map((t) => ({
        transferId: t._id,
        transferNo: t.transferNo,
        quantity: t.quantity,
        expectedDate: t.expectedDate,
        status: t.status,
      })),
      stockoutHistory,
      leadTimeStats,
    };

    res.json({ success: true, data: drilldown });
  })
);

router.post(
  "/",
  validateRequest(SafetyStockCreateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as SafetyStockCreateSchema["_output"];
    const existing = await SafetyStockModel.findOne({ sku: body.sku });
    if (existing) {
      throw new AppError("该 SKU 已设置安全库存", 400);
    }

    const totalStock = await InventoryModel.aggregate([
      { $match: { sku: body.sku } },
      { $group: { _id: null, total: { $sum: "$availableQuantity" } } },
    ]);

    const currentStock = totalStock[0]?.total || 0;
    let status: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
    if (currentStock <= body.minQuantity) status = "CRITICAL";
    else if (currentStock <= body.reorderPoint) status = "WARNING";

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + body.reviewPeriodDays);

    const safetyStock = await SafetyStockModel.create({
      ...body,
      currentStock,
      status,
      nextReviewDate: nextReview,
    });

    res.status(201).json({ success: true, data: safetyStock });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body as Partial<SafetyStockCreateSchema["_output"]> & {
      reason?: string;
      operator?: string;
    };

    const safetyStock = await SafetyStockModel.findById(id);
    if (!safetyStock) {
      throw new AppError("安全库存记录不存在", 404);
    }

    const { reason, operator, ...fields } = updateData;
    const fromStatus = safetyStock.status;

    Object.assign(safetyStock, fields);

    if (fields.minQuantity !== undefined || fields.reorderPoint !== undefined) {
      if (safetyStock.currentStock <= safetyStock.minQuantity) {
        safetyStock.status = "CRITICAL";
      } else if (safetyStock.currentStock <= safetyStock.reorderPoint) {
        safetyStock.status = "WARNING";
      } else {
        safetyStock.status = "NORMAL";
      }
    }

    if (safetyStock.status !== fromStatus && reason && operator) {
      await recordStatusChange({
        entityId: safetyStock._id,
        entityType: "SAFETY_STOCK",
        fromStatus,
        toStatus: safetyStock.status,
        reason,
        operator,
      });
    }

    await safetyStock.save();
    res.json({ success: true, data: safetyStock });
  })
);

export default router;
