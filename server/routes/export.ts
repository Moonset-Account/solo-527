import { Router } from "express";
import ExcelJS from "exceljs";
import dayjs from "dayjs";
import Appointment from "../models/Appointment.js";
import Schedule from "../models/Schedule.js";
import Commission from "../models/Commission.js";
import MaterialUsage from "../models/MaterialUsage.js";
import CustomerTreatment from "../models/CustomerTreatment.js";
import Treatment from "../models/Treatment.js";
import ChangeLog from "../models/ChangeLog.js";
import { successResponse, errorResponse } from "../utils/index.js";

const router = Router();

router.get("/appointments", async (req, res) => {
  try {
    const {
      keyword,
      status,
      paymentStatus,
      technicianId,
      startDate,
      endDate,
      ...restFilters
    } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { customerName: { $regex: keyword, $options: "i" } },
        { customerPhone: { $regex: keyword, $options: "i" } },
        { appointmentNo: { $regex: keyword, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (technicianId) filter.technicianId = technicianId;
    if (startDate && endDate) {
      filter.appointmentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const appointments = await Appointment.find(filter).sort({
      appointmentDate: -1,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("预约记录");

    worksheet.columns = [
      { header: "预约单号", key: "appointmentNo", width: 20 },
      { header: "客户姓名", key: "customerName", width: 12 },
      { header: "手机号", key: "customerPhone", width: 15 },
      { header: "项目名称", key: "treatmentName", width: 20 },
      { header: "技师", key: "technicianName", width: 12 },
      { header: "预约日期", key: "appointmentDate", width: 12 },
      { header: "开始时间", key: "startTime", width: 10 },
      { header: "结束时间", key: "endTime", width: 10 },
      { header: "价格", key: "price", width: 10 },
      { header: "实付金额", key: "paidAmount", width: 12 },
      { header: "状态", key: "status", width: 10 },
      { header: "支付状态", key: "paymentStatus", width: 10 },
      { header: "备注", key: "remark", width: 30 },
      { header: "创建时间", key: "createdAt", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    appointments.forEach((appt) => {
      worksheet.addRow({
        appointmentNo: appt.appointmentNo,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        treatmentName: appt.treatmentName,
        technicianName: appt.technicianName,
        appointmentDate: dayjs(appt.appointmentDate).format("YYYY-MM-DD"),
        startTime: appt.startTime,
        endTime: appt.endTime,
        price: appt.price,
        paidAmount: appt.paidAmount || 0,
        status: appt.status,
        paymentStatus: appt.paymentStatus,
        remark: appt.remark || "",
        createdAt: dayjs(appt.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    const infoRow = worksheet.addRow({
      appointmentNo: `筛选条件: ${JSON.stringify({
        keyword,
        status,
        paymentStatus,
        technicianId,
        startDate,
        endDate,
      })}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:N${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };
    worksheet.getRow(worksheet.rowCount).alignment = { wrapText: true };

    const timeRow = worksheet.addRow({
      appointmentNo: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:N${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };

    const filename = `预约记录_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/schedules", async (req, res) => {
  try {
    const { startDate, endDate, technicianId, shiftType, ...restFilters } =
      req.query;

    const filter: any = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    if (technicianId) filter.technicianId = technicianId;
    if (shiftType) filter.shiftType = shiftType;

    const schedules = await Schedule.find(filter).sort({
      date: 1,
      technicianName: 1,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("排班记录");

    worksheet.columns = [
      { header: "技师姓名", key: "technicianName", width: 12 },
      { header: "日期", key: "date", width: 12 },
      { header: "班次类型", key: "shiftType", width: 10 },
      { header: "上班时间", key: "startTime", width: 10 },
      { header: "下班时间", key: "endTime", width: 10 },
      { header: "请假类型", key: "leaveType", width: 10 },
      { header: "请假状态", key: "leaveStatus", width: 10 },
      { header: "状态", key: "status", width: 10 },
      { header: "备注", key: "remark", width: 30 },
      { header: "创建时间", key: "createdAt", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    schedules.forEach((sched) => {
      worksheet.addRow({
        technicianName: sched.technicianName,
        date: dayjs(sched.date).format("YYYY-MM-DD"),
        shiftType: sched.shiftType,
        startTime: sched.startTime || "",
        endTime: sched.endTime || "",
        leaveType: sched.leaveType || "",
        leaveStatus: sched.leaveStatus || "",
        status: sched.status,
        remark: sched.remark || "",
        createdAt: dayjs(sched.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    const filterInfo = worksheet.addRow({
      technicianName: `筛选条件: ${JSON.stringify({
        startDate,
        endDate,
        technicianId,
        shiftType,
      })}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:J${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };
    worksheet.getRow(worksheet.rowCount).alignment = { wrapText: true };

    const timeInfo = worksheet.addRow({
      technicianName: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:J${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };

    const filename = `排班记录_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/commissions", async (req, res) => {
  try {
    const { type, status, staffId, staffType, startDate, endDate, keyword, ...restFilters } =
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

    const commissions = await Commission.find(filter).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("提成记录");

    worksheet.columns = [
      { header: "提成单号", key: "commissionNo", width: 20 },
      { header: "类型", key: "type", width: 10 },
      { header: "人员姓名", key: "staffName", width: 12 },
      { header: "客户", key: "customerName", width: 12 },
      { header: "项目", key: "treatmentName", width: 20 },
      { header: "关联预约", key: "appointmentNo", width: 20 },
      { header: "服务金额", key: "serviceAmount", width: 12 },
      { header: "提成比例", key: "commissionRate", width: 10 },
      { header: "提成金额", key: "commissionAmount", width: 12 },
      { header: "状态", key: "status", width: 10 },
      { header: "备注", key: "remark", width: 20 },
      { header: "创建时间", key: "createdAt", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    commissions.forEach((comm) => {
      worksheet.addRow({
        commissionNo: comm.commissionNo,
        type: comm.type,
        staffName: comm.staffName,
        customerName: comm.customerName || "",
        treatmentName: comm.treatmentName || "",
        appointmentNo: comm.appointmentNo || "",
        serviceAmount: comm.serviceAmount,
        commissionRate: comm.commissionRate,
        commissionAmount: comm.commissionAmount,
        status: comm.status,
        remark: comm.remark || "",
        createdAt: dayjs(comm.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    const filterInfo = worksheet.addRow({
      commissionNo: `筛选条件: ${JSON.stringify({
        type,
        status,
        staffId,
        startDate,
        endDate,
      })}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:L${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };
    worksheet.getRow(worksheet.rowCount).alignment = { wrapText: true };

    const timeInfo = worksheet.addRow({
      commissionNo: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:L${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };

    const filename = `提成记录_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/material-usages", async (req, res) => {
  try {
    const { type, status, technicianId, appointmentId, startDate, endDate, keyword, ...restFilters } =
      req.query;

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

    const usages = await MaterialUsage.find(filter).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("耗材消耗");

    worksheet.columns = [
      { header: "消耗单号", key: "usageNo", width: 20 },
      { header: "类型", key: "type", width: 12 },
      { header: "技师", key: "technicianName", width: 12 },
      { header: "客户", key: "customerName", width: 12 },
      { header: "项目", key: "treatmentName", width: 20 },
      { header: "关联预约", key: "appointmentNo", width: 20 },
      { header: "总成本", key: "totalCost", width: 12 },
      { header: "状态", key: "status", width: 10 },
      { header: "操作员", key: "operator", width: 12 },
      { header: "备注", key: "remark", width: 20 },
      { header: "创建时间", key: "createdAt", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    usages.forEach((usage) => {
      worksheet.addRow({
        usageNo: usage.usageNo,
        type: usage.type,
        technicianName: usage.technicianName || "",
        customerName: usage.customerName || "",
        treatmentName: usage.treatmentName || "",
        appointmentNo: usage.appointmentNo || "",
        totalCost: usage.totalCost,
        status: usage.status,
        operator: usage.operator || "",
        remark: usage.remark || "",
        createdAt: dayjs(usage.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    const filterInfo = worksheet.addRow({
      usageNo: `筛选条件: ${JSON.stringify({
        type,
        status,
        technicianId,
        startDate,
        endDate,
      })}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:K${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };
    worksheet.getRow(worksheet.rowCount).alignment = { wrapText: true };

    const timeInfo = worksheet.addRow({
      usageNo: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:K${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };

    const filename = `耗材消耗_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/change-logs", async (req, res) => {
  try {
    const { module, action, targetType, operator, startDate, endDate } =
      req.query;

    const filter: any = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (operator) filter.operator = operator;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const logs = await ChangeLog.find(filter).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("操作日志");

    worksheet.columns = [
      { header: "日志编号", key: "logNo", width: 20 },
      { header: "模块", key: "module", width: 12 },
      { header: "操作", key: "action", width: 10 },
      { header: "目标名称", key: "targetName", width: 20 },
      { header: "目标编号", key: "targetNo", width: 20 },
      { header: "关联单据", key: "relatedDocNo", width: 20 },
      { header: "操作人", key: "operator", width: 12 },
      { header: "备注", key: "remark", width: 30 },
      { header: "操作时间", key: "createdAt", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    logs.forEach((log) => {
      worksheet.addRow({
        logNo: log.logNo,
        module: log.module,
        action: log.action,
        targetName: log.targetName || "",
        targetNo: log.targetNo || "",
        relatedDocNo: log.relatedDocNo || "",
        operator: log.operator,
        remark: log.remark || "",
        createdAt: dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    const filterInfo = worksheet.addRow({
      logNo: `筛选条件: ${JSON.stringify({
        module,
        action,
        targetType,
        operator,
        startDate,
        endDate,
      })}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:I${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };
    worksheet.getRow(worksheet.rowCount).alignment = { wrapText: true };

    const timeInfo = worksheet.addRow({
      logNo: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:I${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };

    const filename = `操作日志_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/customer-treatments", async (req, res) => {
  try {
    const { customerId, treatmentId, status, keyword } = req.query;

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

    const treatments = await CustomerTreatment.find(filter).sort({
      createdAt: -1,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("客户疗程");

    worksheet.columns = [
      { header: "客户姓名", key: "customerName", width: 12 },
      { header: "项目名称", key: "treatmentName", width: 20 },
      { header: "总次数", key: "totalTimes", width: 10 },
      { header: "已用次数", key: "usedTimes", width: 10 },
      { header: "剩余次数", key: "remainingTimes", width: 10 },
      { header: "总金额", key: "totalAmount", width: 12 },
      { header: "购买日期", key: "purchaseDate", width: 12 },
      { header: "有效期", key: "expireDate", width: 12 },
      { header: "状态", key: "status", width: 10 },
      { header: "来源", key: "source", width: 10 },
      { header: "订单号", key: "orderNo", width: 20 },
      { header: "创建时间", key: "createdAt", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    treatments.forEach((t) => {
      worksheet.addRow({
        customerName: t.customerName,
        treatmentName: t.treatmentName,
        totalTimes: t.totalTimes,
        usedTimes: t.usedTimes,
        remainingTimes: t.remainingTimes,
        totalAmount: t.totalAmount,
        purchaseDate: dayjs(t.purchaseDate).format("YYYY-MM-DD"),
        expireDate: t.expireDate ? dayjs(t.expireDate).format("YYYY-MM-DD") : "",
        status: t.status,
        source: t.source,
        orderNo: t.orderNo,
        createdAt: dayjs(t.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    const filterInfo = worksheet.addRow({
      customerName: `筛选条件: ${JSON.stringify({
        customerId,
        treatmentId,
        status,
        keyword,
      })}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:L${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };
    worksheet.getRow(worksheet.rowCount).alignment = { wrapText: true };

    const timeInfo = worksheet.addRow({
      customerName: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:L${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };

    const filename = `客户疗程_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/treatments", async (req, res) => {
  try {
    const { keyword, category, status } = req.query;

    const filter: any = {};
    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const treatments = await Treatment.find(filter).sort({ sortOrder: 1, createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("项目管理");

    worksheet.columns = [
      { header: "项目名称", key: "name", width: 25 },
      { header: "分类", key: "category", width: 12 },
      { header: "时长(分钟)", key: "duration", width: 12 },
      { header: "售价(元)", key: "price", width: 12 },
      { header: "成本(元)", key: "cost", width: 12 },
      { header: "状态", key: "status", width: 10 },
      { header: "描述", key: "description", width: 30 },
      { header: "创建时间", key: "createdAt", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    treatments.forEach((t) => {
      worksheet.addRow({
        name: t.name,
        category: t.category,
        duration: t.duration,
        price: t.price,
        cost: t.cost,
        status: t.status,
        description: t.description || "",
        createdAt: dayjs(t.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      });
    });

    const filterInfo = worksheet.addRow({
      name: `筛选条件: ${JSON.stringify({ keyword, category, status })}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:H${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };
    worksheet.getRow(worksheet.rowCount).alignment = { wrapText: true };

    const timeInfo = worksheet.addRow({
      name: `导出时间: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    });
    worksheet.mergeCells(`A${worksheet.rowCount}:H${worksheet.rowCount}`);
    worksheet.getRow(worksheet.rowCount).font = { italic: true, size: 10 };

    const filename = `项目管理_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
