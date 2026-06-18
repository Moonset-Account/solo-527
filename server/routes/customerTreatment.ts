import { Router } from "express";
import CustomerTreatment from "../models/CustomerTreatment.js";
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
    const { keyword, customerId, treatmentId, status } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { customerName: { $regex: keyword, $options: "i" } },
        { treatmentName: { $regex: keyword, $options: "i" } },
      ];
    }
    if (customerId) filter.customerId = customerId;
    if (treatmentId) filter.treatmentId = treatmentId;
    if (status) filter.status = status;

    const total = await CustomerTreatment.countDocuments(filter);
    const list = await CustomerTreatment.find(filter)
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

router.get("/customer/:customerId", async (req, res) => {
  try {
    const list = await CustomerTreatment.find({
      customerId: req.params.customerId,
    }).sort({ createdAt: -1 });
    res.json(successResponse(list));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const customerTreatment = await CustomerTreatment.findById(req.params.id);
    if (!customerTreatment) {
      return res.json(errorResponse("客户疗程不存在"));
    }
    res.json(successResponse(customerTreatment));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      treatmentId,
      treatmentName,
      totalTimes,
      totalAmount,
      purchaseDate,
      expireDate,
      source,
      orderNo,
      remark,
    } = req.body;

    if (!customerId || !treatmentId || !totalTimes || !totalAmount) {
      return res.json(errorResponse("客户、项目、次数和金额不能为空"));
    }

    const customerTreatment = new CustomerTreatment({
      customerId,
      customerName,
      treatmentId,
      treatmentName,
      totalTimes,
      usedTimes: 0,
      remainingTimes: totalTimes,
      totalAmount,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      expireDate: expireDate ? new Date(expireDate) : undefined,
      source: source || "购买",
      orderNo: orderNo || generateOrderNo("DD"),
      remark,
      history: [
        {
          date: new Date(),
          type: "购买",
          changeTimes: totalTimes,
          balanceAfter: totalTimes,
          operator: "admin",
          remark: "购买疗程",
        },
      ],
    });

    await customerTreatment.save();

    await createChangeLog({
      module: "疗程",
      action: "创建",
      targetId: customerTreatment._id,
      targetType: "CustomerTreatment",
      targetNo: customerTreatment.orderNo,
      targetName: customerTreatment.treatmentName,
      afterData: customerTreatment.toObject(),
      relatedDocId: customerTreatment._id,
      relatedDocType: "CustomerTreatment",
      relatedDocNo: customerTreatment.orderNo,
      operator: "admin",
      operatorRole: "管理员",
      remark: "客户购买疗程",
    });

    res.json(successResponse(customerTreatment, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/use", async (req, res) => {
  try {
    const { times, appointmentId, appointmentNo, operator, remark } = req.body;
    const customerTreatment = await CustomerTreatment.findById(req.params.id);
    if (!customerTreatment) {
      return res.json(errorResponse("客户疗程不存在"));
    }

    if (customerTreatment.remainingTimes < times) {
      return res.json(errorResponse("剩余次数不足"));
    }

    const beforeData = customerTreatment.toObject();

    customerTreatment.usedTimes = customerTreatment.usedTimes + times;
    customerTreatment.remainingTimes = customerTreatment.remainingTimes - times;

    if (customerTreatment.remainingTimes <= 0) {
      customerTreatment.status = "已用完";
    }

    customerTreatment.history.push({
      date: new Date(),
      type: "使用",
      changeTimes: -times,
      balanceAfter: customerTreatment.remainingTimes,
      appointmentId,
      appointmentNo,
      operator: operator || "admin",
      remark: remark || "使用疗程",
    });

    await customerTreatment.save();

    await createChangeLog({
      module: "疗程",
      action: "修改",
      targetId: customerTreatment._id,
      targetType: "CustomerTreatment",
      targetNo: customerTreatment.orderNo,
      targetName: customerTreatment.treatmentName,
      beforeData,
      afterData: customerTreatment.toObject(),
      relatedDocId: appointmentId,
      relatedDocType: "Appointment",
      relatedDocNo: appointmentNo,
      operator: "admin",
      operatorRole: "管理员",
      remark: `使用${times}次疗程`,
    });

    res.json(successResponse(customerTreatment, "使用成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/adjust", async (req, res) => {
  try {
    const { changeTimes, type, operator, remark } = req.body;
    const customerTreatment = await CustomerTreatment.findById(req.params.id);
    if (!customerTreatment) {
      return res.json(errorResponse("客户疗程不存在"));
    }

    const beforeData = customerTreatment.toObject();

    customerTreatment.totalTimes = customerTreatment.totalTimes + changeTimes;
    customerTreatment.remainingTimes = customerTreatment.remainingTimes + changeTimes;

    if (customerTreatment.remainingTimes <= 0) {
      customerTreatment.status = "已用完";
    } else {
      customerTreatment.status = "有效";
    }

    customerTreatment.history.push({
      date: new Date(),
      type: type || "调整",
      changeTimes,
      balanceAfter: customerTreatment.remainingTimes,
      operator: operator || "admin",
      remark: remark || "调整次数",
    });

    await customerTreatment.save();

    await createChangeLog({
      module: "疗程",
      action: "修改",
      targetId: customerTreatment._id,
      targetType: "CustomerTreatment",
      targetNo: customerTreatment.orderNo,
      targetName: customerTreatment.treatmentName,
      beforeData,
      afterData: customerTreatment.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: remark || "调整疗程次数",
    });

    res.json(successResponse(customerTreatment, "调整成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/summary/:customerId", async (req, res) => {
  try {
    const treatments = await CustomerTreatment.find({
      customerId: req.params.customerId,
      status: "有效",
    }).select("treatmentId treatmentName totalTimes usedTimes remainingTimes expireDate");

    const totalRemaining = treatments.reduce((sum, t) => sum + t.remainingTimes, 0);
    const totalTreatments = treatments.length;

    res.json(
      successResponse({
        treatments,
        totalRemaining,
        totalTreatments,
      })
    );
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
