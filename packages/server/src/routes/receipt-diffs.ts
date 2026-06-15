import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { asyncHandler, AppError } from "../middleware/error";
import { validateRequest } from "../middleware/validate";
import { ReceiptDiffCreateSchema, StatusChangeSchema } from "@qinghe/shared";
import { ReceiptDiffModel } from "../models/ReceiptDiff";
import { SafetyStockModel } from "../models/SafetyStock";
import { recordStatusChange } from "../models/StatusHistory";

const router = Router();

function generateDiffNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RD-${dateStr}-${random}`;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      pageSize = "20",
      status,
      diffType,
      sku,
      batchNo,
      inboundOrderNo,
      relatedSafetyStockId,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (diffType) filter.diffType = diffType;
    if (sku) filter.sku = { $regex: sku, $options: "i" };
    if (batchNo) filter.batchNo = batchNo;
    if (inboundOrderNo) filter.inboundOrderNo = inboundOrderNo;
    if (relatedSafetyStockId) filter.relatedSafetyStockId = relatedSafetyStockId;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await ReceiptDiffModel.countDocuments(filter);
    const data = await ReceiptDiffModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: { data, total, page: pageNum, pageSize: size },
    });
  })
);

router.post(
  "/",
  validateRequest(ReceiptDiffCreateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as ReceiptDiffCreateSchema["_output"];
    const diffQuantity = body.expectedQuantity - body.actualQuantity;

    let impactOnSafetyStock = false;
    if (body.relatedSafetyStockId) {
      const safetyStock = await SafetyStockModel.findById(body.relatedSafetyStockId);
      if (safetyStock && diffQuantity > 0) {
        impactOnSafetyStock =
          safetyStock.currentStock - diffQuantity <= safetyStock.reorderPoint;
      }
    }

    const diff = await ReceiptDiffModel.create({
      ...body,
      diffNo: generateDiffNo(),
      diffQuantity,
      status: "PENDING",
      impactOnSafetyStock,
    });

    await recordStatusChange({
      entityId: diff._id,
      entityType: "RECEIPT_DIFF",
      fromStatus: "",
      toStatus: "PENDING",
      reason: body.description,
      operator: body.reporter,
    });

    res.status(201).json({ success: true, data: diff });
  })
);

router.patch(
  "/:id/status",
  validateRequest(StatusChangeSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { toStatus, reason, operator } = req.body as StatusChangeSchema["_output"];

    const diff = await ReceiptDiffModel.findById(id);
    if (!diff) {
      throw new AppError("签收差异记录不存在", 404);
    }

    const fromStatus = diff.status;
    diff.status = toStatus as typeof diff.status;

    if (toStatus === "COMPLETED") {
      diff.handler = operator;
      diff.handledAt = new Date();
    }
    if (toStatus === "APPROVED") {
      diff.approver = operator;
      diff.approvedAt = new Date();
    }

    await diff.save();

    await recordStatusChange({
      entityId: diff._id,
      entityType: "RECEIPT_DIFF",
      fromStatus,
      toStatus,
      reason,
      operator,
    });

    res.json({ success: true, data: diff });
  })
);

router.patch(
  "/:id/resolve",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      rootCause,
      correctiveAction,
      handler,
      operator,
    } = req.body as {
      rootCause: string;
      correctiveAction: string;
      handler?: string;
      operator: string;
    };

    const diff = await ReceiptDiffModel.findById(id);
    if (!diff) {
      throw new AppError("签收差异记录不存在", 404);
    }

    const fromStatus = diff.status;
    diff.rootCause = rootCause;
    diff.correctiveAction = correctiveAction;
    if (handler) diff.handler = handler;
    diff.handledAt = new Date();
    diff.status = "COMPLETED";

    await diff.save();

    await recordStatusChange({
      entityId: diff._id,
      entityType: "RECEIPT_DIFF",
      fromStatus,
      toStatus: "COMPLETED",
      reason: `处理完成：${rootCause}；措施：${correctiveAction}`,
      operator,
      extraData: { rootCause, correctiveAction, handler },
    });

    res.json({ success: true, data: diff });
  })
);

export default router;
