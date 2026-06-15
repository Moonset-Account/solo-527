import { Router } from "express";
import { asyncHandler, AppError } from "../middleware/error";
import { validateRequest } from "../middleware/validate";
import { LocationCreateSchema, StatusChangeSchema } from "@qinghe/shared";
import { LocationModel } from "../models/Location";
import { recordStatusChange } from "../models/StatusHistory";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      page = "1",
      pageSize = "50",
      zone,
      type,
      status,
      temperatureZone,
      keyword,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (zone) filter.zone = zone;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (temperatureZone) filter.temperatureZone = temperatureZone;
    if (keyword) {
      filter.$or = [
        { code: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const size = parseInt(pageSize as string, 10);
    const total = await LocationModel.countDocuments(filter);
    const data = await LocationModel.find(filter)
      .sort({ zone: 1, aisle: 1, shelf: 1, layer: 1, position: 1 })
      .skip((pageNum - 1) * size)
      .limit(size);

    res.json({
      success: true,
      data: { data, total, page: pageNum, pageSize: size },
    });
  })
);

router.get(
  "/:code",
  asyncHandler(async (req, res) => {
    const location = await LocationModel.findOne({ code: req.params.code });
    if (!location) {
      throw new AppError("库位不存在", 404);
    }
    res.json({ success: true, data: location });
  })
);

router.post(
  "/",
  validateRequest(LocationCreateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as (typeof LocationCreateSchema)["_output"];
    const existing = await LocationModel.findOne({ code: body.code });
    if (existing) {
      throw new AppError("库位编码已存在", 400);
    }

    const location = await LocationModel.create({
      ...body,
      currentCapacity: 0,
      status: "ACTIVE",
    });

    res.status(201).json({ success: true, data: location });
  })
);

router.patch(
  "/:code/status",
  validateRequest(StatusChangeSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { toStatus, reason, operator } = req.body as (typeof StatusChangeSchema)["_output"];

    const location = await LocationModel.findOne({ code });
    if (!location) {
      throw new AppError("库位不存在", 404);
    }

    const fromStatus = location.status;
    location.status = toStatus as typeof location.status;
    await location.save();

    await recordStatusChange({
      entityId: location._id,
      entityType: "LOCATION",
      fromStatus,
      toStatus,
      reason,
      operator,
    });

    res.json({ success: true, data: location });
  })
);

export default router;
