import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { asyncHandler, AppError } from "../middleware/error";
import { validateRequest } from "../middleware/validate";
import { TransferCreateSchema, StatusChangeSchema } from "@qinghe/shared";
import { TransferModel } from "../models/Transfer";
import { SafetyStockModel } from "../models/SafetyStock";
import { recordStatusChange } from "../models/StatusHistory";

const router = Router();

function generateTransferNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TR-${dateStr}-${random}`;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      pageSize = "20",
      status,
      type,
      sku,
      relatedSafetyStockId,
      startDate,
      endDate,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (sku) filter.sku = { $regex: sku, $options: "i" };
    if (relatedSafetyStockId) filter.relatedSafetyStockId = relatedSafetyStockId;
    if (startDate || endDate) {
      filter.expectedDate = {};
      if (startDate) filter.expectedDate.$gte = new Date(startDate as string);
      if (endDate) filter.expectedDate.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await TransferModel.countDocuments(filter);
    const data = await TransferModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: { data, total, page: pageNum, pageSize: size },
    });
  })
);

router.get(
  "/delayed",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const delayed = await TransferModel.find({
      status: { $in: ["PENDING", "APPROVED"] },
      expectedDate: { $lt: now },
    }).sort({ expectedDate: 1 });

    res.json({ success: true, data: delayed });
  })
);

router.post(
  "/",
  validateRequest(TransferCreateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as TransferCreateSchema["_output"];

    const transfer = await TransferModel.create({
      ...body,
      transferNo: generateTransferNo(),
      plannedDate: new Date(body.plannedDate),
      expectedDate: new Date(body.expectedDate),
      status: "PENDING",
    });

    await recordStatusChange({
      entityId: transfer._id,
      entityType: "TRANSFER",
      fromStatus: "",
      toStatus: "PENDING",
      reason: "创建调拨申请",
      operator: body.applicant,
    });

    res.status(201).json({ success: true, data: transfer });
  })
);

router.patch(
  "/:id/status",
  validateRequest(StatusChangeSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { toStatus, reason, operator } = req.body as StatusChangeSchema["_output"];

    const transfer = await TransferModel.findById(id);
    if (!transfer) {
      throw new AppError("调拨单不存在", 404);
    }

    const fromStatus = transfer.status;

    if (toStatus === "APPROVED" && fromStatus !== "PENDING") {
      throw new AppError("只有待审批的调拨单可以审批", 400);
    }
    if (toStatus === "COMPLETED" && fromStatus !== "APPROVED" && fromStatus !== "DELAYED") {
      throw new AppError("只有已审批或延迟的调拨单可以完成", 400);
    }

    transfer.status = toStatus as typeof transfer.status;
    if (toStatus === "APPROVED") {
      transfer.approver = operator;
      transfer.approvedAt = new Date();
    }
    if (toStatus === "COMPLETED") {
      transfer.actualDate = new Date();
      transfer.handler = operator;
      transfer.handlingEndTime = new Date();
    }

    await transfer.save();

    await recordStatusChange({
      entityId: transfer._id,
      entityType: "TRANSFER",
      fromStatus,
      toStatus,
      reason,
      operator,
    });

    if (toStatus === "COMPLETED" && transfer.relatedSafetyStockId) {
      const safetyStock = await SafetyStockModel.findById(
        transfer.relatedSafetyStockId
      );
      if (safetyStock) {
        safetyStock.lastRestockDate = new Date();
        await safetyStock.save();
      }
    }

    res.json({ success: true, data: transfer });
  })
);

router.patch(
  "/:id/delay",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      delayReason,
      delayReasonCategory,
      handler,
      operator,
    } = req.body as {
      delayReason: string;
      delayReasonCategory: string;
      handler?: string;
      operator: string;
    };

    const transfer = await TransferModel.findById(id);
    if (!transfer) {
      throw new AppError("调拨单不存在", 404);
    }

    const fromStatus = transfer.status;
    transfer.status = "DELAYED";
    transfer.delayReason = delayReason;
    transfer.delayReasonCategory = delayReasonCategory;
    if (handler) {
      transfer.handler = handler;
      transfer.handlingStartTime = new Date();
    }

    await transfer.save();

    await recordStatusChange({
      entityId: transfer._id,
      entityType: "TRANSFER",
      fromStatus,
      toStatus: "DELAYED",
      reason: delayReason,
      operator,
      extraData: { delayReasonCategory, handler },
    });

    res.json({ success: true, data: transfer });
  })
);

export default router;
