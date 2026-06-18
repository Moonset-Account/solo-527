import { Router } from "express";
import MaterialUsage from "../models/MaterialUsage.js";
import {
  successResponse,
  errorResponse,
  pagination,
  generateOrderNo,
  createChangeLog,
} from "../utils/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { skip, page, pageSize } = pagination(req.query);
    const {
      keyword,
      type,
      status,
      technicianId,
      appointmentId,
      startDate,
      endDate,
    } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { usageNo: { $regex: keyword, $options: "i" } },
        { technicianName: { $regex: keyword, $options: "i" } },
        { customerName: { $regex: keyword, $options: "i" } },
      ];
    }
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (technicianId) filter.technicianId = technicianId;
    if (appointmentId) filter.appointmentId = appointmentId;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const total = await MaterialUsage.countDocuments(filter);
    const list = await MaterialUsage.find(filter)
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
    const materialUsage = await MaterialUsage.findById(req.params.id);
    if (!materialUsage) {
      return res.json(errorResponse("耗材消耗记录不存在"));
    }
    res.json(successResponse(materialUsage));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      appointmentId,
      appointmentNo,
      customerId,
      customerName,
      technicianId,
      technicianName,
      treatmentId,
      treatmentName,
      items,
      type,
      operator,
      remark,
    } = req.body;

    if (!items || items.length === 0) {
      return res.json(errorResponse("耗材明细不能为空"));
    }

    const totalCost = items.reduce((sum: number, item: any) => {
      return sum + (item.totalCost || item.unitCost * item.quantity || 0);
    }, 0);

    const usageNo = generateOrderNo("HC");

    const materialUsage = new MaterialUsage({
      usageNo,
      appointmentId,
      appointmentNo,
      customerId,
      customerName,
      technicianId,
      technicianName,
      treatmentId,
      treatmentName,
      items,
      totalCost,
      type: type || "服务消耗",
      operator: operator || "admin",
      remark,
      changeHistory: [
        {
          changedAt: new Date(),
          changedBy: "admin",
          changeType: "创建",
          remark: "创建耗材消耗记录",
        },
      ],
    });

    await materialUsage.save();

    await createChangeLog({
      module: "耗材消耗",
      action: "创建",
      targetId: materialUsage._id,
      targetType: "MaterialUsage",
      targetNo: materialUsage.usageNo,
      afterData: materialUsage.toObject(),
      relatedDocId: appointmentId,
      relatedDocType: "Appointment",
      relatedDocNo: appointmentNo,
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建耗材消耗记录",
    });

    res.json(successResponse(materialUsage, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/confirm", async (req, res) => {
  try {
    const { remark } = req.body;
    const materialUsage = await MaterialUsage.findById(req.params.id);
    if (!materialUsage) {
      return res.json(errorResponse("耗材消耗记录不存在"));
    }

    const beforeData = materialUsage.toObject();

    materialUsage.status = "已确认";
    materialUsage.changeHistory.push({
      changedAt: new Date(),
      changedBy: "admin",
      changeType: "确认",
      before: beforeData,
      after: materialUsage.toObject(),
      remark: remark || "确认耗材消耗",
    });

    await materialUsage.save();

    await createChangeLog({
      module: "耗材消耗",
      action: "状态变更",
      targetId: materialUsage._id,
      targetType: "MaterialUsage",
      targetNo: materialUsage.usageNo,
      beforeData,
      afterData: materialUsage.toObject(),
      relatedDocId: materialUsage.appointmentId,
      relatedDocType: "Appointment",
      relatedDocNo: materialUsage.appointmentNo,
      operator: "admin",
      operatorRole: "管理员",
      remark: "确认耗材消耗",
    });

    res.json(successResponse(materialUsage, "确认成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const materialUsage = await MaterialUsage.findById(req.params.id);
    if (!materialUsage) {
      return res.json(errorResponse("耗材消耗记录不存在"));
    }

    const beforeData = materialUsage.toObject();

    if (req.body.items) {
      const totalCost = req.body.items.reduce(
        (sum: number, item: any) =>
          sum + (item.totalCost || item.unitCost * item.quantity || 0),
        0
      );
      req.body.totalCost = totalCost;
    }

    Object.assign(materialUsage, req.body);
    materialUsage.originalRecord = beforeData;
    materialUsage.changeHistory.push({
      changedAt: new Date(),
      changedBy: "admin",
      changeType: "修改",
      before: beforeData,
      after: materialUsage.toObject(),
      remark: req.body.remark || "修改耗材消耗记录",
    });

    await materialUsage.save();

    await createChangeLog({
      module: "耗材消耗",
      action: "修改",
      targetId: materialUsage._id,
      targetType: "MaterialUsage",
      targetNo: materialUsage.usageNo,
      beforeData,
      afterData: materialUsage.toObject(),
      relatedDocId: materialUsage.appointmentId,
      relatedDocType: "Appointment",
      relatedDocNo: materialUsage.appointmentNo,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改耗材消耗记录",
    });

    res.json(successResponse(materialUsage, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
