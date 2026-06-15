import { Router } from "express";
import { asyncHandler } from "../middleware/error";
import { StatusHistoryModel } from "../models/StatusHistory";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      entityType,
      entityId,
      page = "1",
      pageSize = "50",
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await StatusHistoryModel.countDocuments(filter);
    const data = await StatusHistoryModel.find(filter)
      .sort({ operationTime: -1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: { data, total, page: pageNum, pageSize: size },
    });
  })
);

router.get(
  "/:entityType/:entityId",
  asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;
    const history = await StatusHistoryModel.find({ entityType, entityId }).sort(
      { operationTime: 1 }
    );

    res.json({ success: true, data: history });
  })
);

export default router;
