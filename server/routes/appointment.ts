import { Router } from "express";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import {
  successResponse,
  errorResponse,
  pagination,
  generateOrderNo,
  createChangeLog,
  compareObjects,
} from "../utils/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { skip, page, pageSize } = pagination(req.query);
    const {
      keyword,
      status,
      paymentStatus,
      technicianId,
      customerId,
      startDate,
      endDate,
      source,
    } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { customerName: { $regex: keyword, $options: "i" } },
        { customerPhone: { $regex: keyword, $options: "i" } },
        { appointmentNo: { $regex: keyword, $options: "i" } },
        { treatmentName: { $regex: keyword, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (technicianId) filter.technicianId = technicianId;
    if (customerId) filter.customerId = customerId;
    if (startDate && endDate) {
      filter.appointmentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    if (source) filter.source = source;

    const total = await Appointment.countDocuments(filter);
    const list = await Appointment.find(filter)
      .sort({ appointmentDate: -1, startTime: -1 })
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
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.json(errorResponse("预约不存在"));
    }
    res.json(successResponse(appointment));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      treatmentId,
      treatmentName,
      technicianId,
      technicianName,
      consultantId,
      consultantName,
      appointmentDate,
      startTime,
      endTime,
      duration,
      price,
      source,
      remark,
    } = req.body;

    if (!customerPhone || !treatmentId || !technicianId || !appointmentDate || !startTime) {
      return res.json(errorResponse("客户手机号、项目、技师、日期和时间不能为空"));
    }

    let customer: any = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
    }
    if (!customer && customerPhone) {
      customer = await Customer.findOne({ phone: customerPhone });
    }
    if (!customer && customerPhone && customerName) {
      customer = new Customer({
        name: customerName,
        phone: customerPhone,
        source: source || "门店",
      });
      await customer.save();
    }
    if (!customer) {
      return res.json(errorResponse("客户信息无效"));
    }

    const finalCustomerId = customer._id;
    const finalCustomerName = customerName || customer.name;
    const finalCustomerPhone = customerPhone || customer.phone;

    const appointmentNo = generateOrderNo("YY");

    const appointment = new Appointment({
      appointmentNo,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      treatmentId,
      treatmentName,
      technicianId,
      technicianName,
      consultantId,
      consultantName,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      duration,
      price,
      actualPrice: price,
      source: source || "门店",
      remark,
      createdBy: "admin",
    });

    await appointment.save();

    await createChangeLog({
      module: "预约",
      action: "创建",
      targetId: appointment._id,
      targetType: "Appointment",
      targetNo: appointment.appointmentNo,
      targetName: appointment.customerName,
      afterData: appointment.toObject(),
      relatedDocId: customer._id,
      relatedDocType: "Customer",
      relatedDocNo: customer.phone,
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建预约",
    });

    res.json(successResponse(appointment, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.json(errorResponse("预约不存在"));
    }

    const beforeData = appointment.toObject();

    Object.assign(appointment, req.body);
    if (req.body.appointmentDate) {
      appointment.appointmentDate = new Date(req.body.appointmentDate);
    }
    await appointment.save();

    const changes = compareObjects(beforeData, appointment.toObject());

    await createChangeLog({
      module: "预约",
      action: "修改",
      targetId: appointment._id,
      targetType: "Appointment",
      targetNo: appointment.appointmentNo,
      targetName: appointment.customerName,
      beforeData,
      afterData: appointment.toObject(),
      changes,
      operator: "admin",
      operatorRole: "管理员",
      remark: "修改预约",
    });

    res.json(successResponse(appointment, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { status, remark, cancelReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.json(errorResponse("预约不存在"));
    }

    const beforeData = appointment.toObject();
    appointment.status = status;

    if (status === "已取消") {
      appointment.cancelReason = cancelReason;
    }
    if (status === "已确认") {
      appointment.confirmedBy = "admin";
      appointment.confirmedAt = new Date();
    }
    if (status === "已完成") {
      appointment.completedAt = new Date();
    }

    await appointment.save();

    await createChangeLog({
      module: "预约",
      action: "状态变更",
      targetId: appointment._id,
      targetType: "Appointment",
      targetNo: appointment.appointmentNo,
      targetName: appointment.customerName,
      beforeData,
      afterData: appointment.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: remark || `状态变更为: ${status}`,
    });

    res.json(successResponse(appointment, "状态更新成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/payment", async (req, res) => {
  try {
    const { paidAmount, paymentMethod, useBalance, usePoints, discount, remark } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.json(errorResponse("预约不存在"));
    }

    const beforeData = appointment.toObject();
    const totalPaid = (appointment.paidAmount || 0) + (paidAmount || 0);
    appointment.paidAmount = totalPaid;
    appointment.paymentMethod = paymentMethod || appointment.paymentMethod;
    if (useBalance) appointment.useBalance = (appointment.useBalance || 0) + useBalance;
    if (usePoints) appointment.usePoints = (appointment.usePoints || 0) + usePoints;
    if (discount) appointment.discount = (appointment.discount || 0) + discount;

    if (totalPaid >= (appointment.actualPrice || appointment.price)) {
      appointment.paymentStatus = "已支付";
    } else if (totalPaid > 0) {
      appointment.paymentStatus = "部分支付";
    }

    await appointment.save();

    await createChangeLog({
      module: "预约",
      action: "修改",
      targetId: appointment._id,
      targetType: "Appointment",
      targetNo: appointment.appointmentNo,
      targetName: appointment.customerName,
      beforeData,
      afterData: appointment.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: remark || "收款",
      relatedDocId: appointment._id,
      relatedDocType: "Appointment",
      relatedDocNo: appointment.appointmentNo,
    });

    res.json(successResponse(appointment, "收款成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.json(errorResponse("预约不存在"));
    }

    await appointment.deleteOne();

    await createChangeLog({
      module: "预约",
      action: "删除",
      targetId: appointment._id,
      targetType: "Appointment",
      targetNo: appointment.appointmentNo,
      targetName: appointment.customerName,
      beforeData: appointment.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "删除预约",
    });

    res.json(successResponse(null, "删除成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
