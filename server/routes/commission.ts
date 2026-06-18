import { Router } from "express";
import Commission from "../models/Commission.js";
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
    const { keyword, type, status, staffId, staffType, startDate, endDate } =
      req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { commissionNo: { $regex: keyword, $options: "i" } },
        { staffName: { $regex: keyword, $options: "i" } },
        { treatmentName: { $regex: keyword, $options: "i" } },
      ];
    }
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (staffId) filter.staffId = staffId;
    if (staffType) filter.staffModel = staffType;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const total = await Commission.countDocuments(filter);
    const list = await Commission.find(filter)
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
    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.json(errorResponse("提成记录不存在"));
    }
    res.json(successResponse(commission));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      type,
      appointmentId,
      appointmentNo,
      customerId,
      customerName,
      staffId,
      staffModel,
      staffName,
      treatmentId,
      treatmentName,
      serviceAmount,
      commissionRate,
      commissionAmount,
      operator,
      remark,
    } = req.body;

    if (!type || !staffId || !staffModel || !serviceAmount || !commissionRate) {
      return res.json(errorResponse("必填参数不完整"));
    }

    const commissionNo = generateOrderNo("TC");

    const commission = new Commission({
      commissionNo,
      type,
      appointmentId,
      appointmentNo,
      customerId,
      customerName,
      staffId,
      staffModel,
      staffName,
      treatmentId,
      treatmentName,
      serviceAmount,
      commissionRate,
      commissionAmount: commissionAmount || serviceAmount * commissionRate,
      operator: operator || "admin",
      remark,
      changeHistory: [
        {
          changedAt: new Date(),
          changedBy: "admin",
          changeType: "创建",
          remark: "创建提成记录",
        },
      ],
    });

    await commission.save();

    await createChangeLog({
      module: "提成",
      action: "创建",
      targetId: commission._id,
      targetType: "Commission",
      targetNo: commission.commissionNo,
      targetName: commission.staffName,
      afterData: commission.toObject(),
      relatedDocId: appointmentId,
      relatedDocType: "Appointment",
      relatedDocNo: appointmentNo,
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建提成记录",
    });

    res.json(successResponse(commission, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/settle", async (req, res) => {
  try {
    const { remark } = req.body;
    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.json(errorResponse("提成记录不存在"));
    }

    const beforeData = commission.toObject();

    commission.status = "已结算";
    commission.settlementDate = new Date();
    commission.changeHistory.push({
      changedAt: new Date(),
      changedBy: "admin",
      changeType: "结算",
      before: beforeData,
      after: commission.toObject(),
      remark: remark || "结算提成",
    });

    await commission.save();

    await createChangeLog({
      module: "提成",
      action: "状态变更",
      targetId: commission._id,
      targetType: "Commission",
      targetNo: commission.commissionNo,
      targetName: commission.staffName,
      beforeData,
      afterData: commission.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "结算提成",
    });

    res.json(successResponse(commission, "结算成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.json(errorResponse("提成记录不存在"));
    }

    const beforeData = commission.toObject();

    if (req.body.serviceAmount && req.body.commissionRate) {
      req.body.commissionAmount = req.body.serviceAmount * req.body.commissionRate;
    } else if (req.body.serviceAmount && !req.body.commissionRate) {
      req.body.commissionAmount = req.body.serviceAmount * commission.commissionRate;
    } else if (req.body.commissionRate && !req.body.serviceAmount) {
      req.body.commissionAmount = commission.serviceAmount * req.body.commissionRate;
    }

    Object.assign(commission, req.body);
    commission.originalRecord = beforeData;
    commission.changeHistory.push({
      changedAt: new Date(),
      changedBy: "admin",
      changeType: "修改",
      before: beforeData,
      after: commission.toObject(),
      remark: req.body.remark || "修改提成记录",
    });

    await commission.save();

    await createChangeLog({
      module: "提成",
      action: "修改",
      targetId: commission._id,
      targetType: "Commission",
      targetNo: commission.commissionNo,
      targetName: commission.staffName,
      beforeData,
      afterData: commission.toObject(),
      relatedDocId: commission.appointmentId,
      relatedDocType: "Appointment",
      relatedDocNo: commission.appointmentNo,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改提成记录",
    });

    res.json(successResponse(commission, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/summary/staff", async (req, res) => {
  try {
    const { startDate, endDate, type, status } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const summary = await Commission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { staffId: "$staffId", staffName: "$staffName", type: "$type" },
          totalAmount: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.json(successResponse(summary));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
