import { Router } from "express";
import { asyncHandler } from "../middleware/error";
import { validateRequest } from "../middleware/validate";
import { BatchCreateSchema, StatusChangeSchema } from "@qinghe/shared";
import { BatchModel } from "../models/Batch";
import { recordStatusChange } from "../models/StatusHistory";
import { AppError } from "../middleware/error";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      pageSize = "20",
      keyword,
      status,
      sku,
      supplier,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (keyword) {
      filter.$or = [
        { batchNo: { $regex: keyword, $options: "i" } },
        { sku: { $regex: keyword, $options: "i" } },
        { skuName: { $regex: keyword, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (sku) filter.sku = sku;
    if (supplier) filter.supplier = supplier;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await BatchModel.countDocuments(filter);
    const data = await BatchModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: {
        data,
        total,
        page: pageNum,
        pageSize: size,
      },
    });
  })
);

router.get(
  "/:batchNo",
  asyncHandler(async (req, res) => {
    const batch = await BatchModel.findOne({ batchNo: req.params.batchNo });
    if (!batch) {
      throw new AppError("批次不存在", 404);
    }
    res.json({ success: true, data: batch });
  })
);

router.post(
  "/",
  validateRequest(BatchCreateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as (typeof BatchCreateSchema)["_output"];
    const existing = await BatchModel.findOne({ batchNo: body.batchNo });
    if (existing) {
      throw new AppError("批次号已存在", 400);
    }

    const batch = await BatchModel.create({
      ...body,
      productionDate: new Date(body.productionDate),
      expiryDate: new Date(body.expiryDate),
      receivedQuantity: 0,
    });

    await recordStatusChange({
      entityId: batch._id,
      entityType: "BATCH",
      fromStatus: "",
      toStatus: "RECEIVING",
      reason: "创建批次",
      operator: body.operator,
    });

    res.status(201).json({ success: true, data: batch });
  })
);

router.patch(
  "/:batchNo/status",
  validateRequest(StatusChangeSchema),
  asyncHandler(async (req, res) => {
    const { batchNo } = req.params;
    const { toStatus, reason, operator } = req.body as (typeof StatusChangeSchema)["_output"];

    const batch = await BatchModel.findOne({ batchNo });
    if (!batch) {
      throw new AppError("批次不存在", 404);
    }

    const fromStatus = batch.status;
    batch.status = toStatus as typeof batch.status;
    await batch.save();

    await recordStatusChange({
      entityId: batch._id,
      entityType: "BATCH",
      fromStatus,
      toStatus,
      reason,
      operator,
    });

    res.json({ success: true, data: batch });
  })
);

router.get(
  "/alerts/expiry",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const warningDays = 7;
    const dangerDays = 3;
    const criticalDays = 1;

    const activeBatches = await BatchModel.find({
      status: { $in: ["RECEIVING", "QUALITY_CHECK", "STORED", "PARTIAL_OUT"] },
    });

    const alerts = activeBatches
      .map((batch) => {
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysRemaining = Math.ceil(
          (new Date(batch.expiryDate).getTime() - now.getTime()) / msPerDay
        );
        let alertLevel: "WARNING" | "DANGER" | "CRITICAL" | null = null;

        if (daysRemaining <= criticalDays) alertLevel = "CRITICAL";
        else if (daysRemaining <= dangerDays) alertLevel = "DANGER";
        else if (daysRemaining <= warningDays) alertLevel = "WARNING";

        return alertLevel ? { batch, daysRemaining, alertLevel } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (a?.daysRemaining ?? 0) - (b?.daysRemaining ?? 0));

    res.json({ success: true, data: alerts });
  })
);

export default router;
