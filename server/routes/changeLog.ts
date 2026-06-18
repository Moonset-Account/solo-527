import { Router } from "express";
import ChangeLog from "../models/ChangeLog.js";
import { successResponse, errorResponse, pagination } from "../utils/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { skip, page, pageSize } = pagination(req.query);
    const { module, action, targetId, targetType, relatedDocId, relatedDocType, operator, keyword, startDate, endDate } =
      req.query;

    const filter: any = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (targetId) filter.targetId = targetId;
    if (targetType) filter.targetType = targetType;
    if (relatedDocId) filter.relatedDocId = relatedDocId;
    if (relatedDocType) filter.relatedDocType = relatedDocType;
    if (operator) filter.operator = operator;
    if (keyword) {
      filter.$or = [
        { targetName: { $regex: keyword, $options: "i" } },
        { targetNo: { $regex: keyword, $options: "i" } },
        { remark: { $regex: keyword, $options: "i" } },
      ];
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const total = await ChangeLog.countDocuments(filter);
    const list = await ChangeLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json(
      successResponse({
        list,
        total,
        page,
        pageSize,
      })
    );
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const log = await ChangeLog.findById(req.params.id);
    if (!log) {
      return res.json(errorResponse("日志不存在"));
    }
    res.json(successResponse(log));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/target/:targetType/:targetId", async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { skip, page, pageSize } = pagination(req.query);

    const filter: any = { targetType, targetId };

    const total = await ChangeLog.countDocuments(filter);
    const list = await ChangeLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json(
      successResponse({
        list,
        total,
        page,
        pageSize,
      })
    );
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/related/:relatedDocType/:relatedDocId", async (req, res) => {
  try {
    const { relatedDocType, relatedDocId } = req.params;
    const { skip, page, pageSize } = pagination(req.query);

    const filter: any = { relatedDocType, relatedDocId };

    const total = await ChangeLog.countDocuments(filter);
    const list = await ChangeLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json(
      successResponse({
        list,
        total,
        page,
        pageSize,
      })
    );
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
