import { Router } from "express";
import dayjs from "dayjs";
import Appointment from "../models/Appointment.js";
import Schedule from "../models/Schedule.js";
import Technician from "../models/Technician.js";
import MaterialUsage from "../models/MaterialUsage.js";
import Commission from "../models/Commission.js";
import Customer from "../models/Customer.js";
import { successResponse, errorResponse } from "../utils/index.js";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const today = dayjs().startOf("day");
    const tomorrow = dayjs().add(1, "day").startOf("day");
    const startOfMonth = dayjs().startOf("month");
    const endOfMonth = dayjs().endOf("month");

    const [
      todayAppointments,
      todayRevenue,
      monthAppointments,
      monthRevenue,
      totalTechnicians,
      totalCustomers,
      todayOnDuty,
      pendingLeaves,
    ] = await Promise.all([
      Appointment.countDocuments({
        appointmentDate: {
          $gte: today.toDate(),
          $lt: tomorrow.toDate(),
        },
        status: { $ne: "已取消" },
      }),
      Appointment.aggregate([
        {
          $match: {
            appointmentDate: {
              $gte: today.toDate(),
              $lt: tomorrow.toDate(),
            },
            status: { $ne: "已取消" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$paidAmount" },
          },
        },
      ]),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: startOfMonth.toDate(),
          $lte: endOfMonth.toDate(),
        },
        status: { $ne: "已取消" },
      }),
      Appointment.aggregate([
        {
          $match: {
            appointmentDate: {
              $gte: startOfMonth.toDate(),
              $lte: endOfMonth.toDate(),
            },
            status: { $ne: "已取消" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$paidAmount" },
          },
        },
      ]),
      Technician.countDocuments({ status: "在职" }),
      Customer.countDocuments(),
      Schedule.countDocuments({
        date: {
          $gte: today.toDate(),
          $lt: tomorrow.toDate(),
        },
        shiftType: { $nin: ["休息", "请假"] },
      }),
      Schedule.countDocuments({
        leaveStatus: "待审批",
      }),
    ]);

    res.json(
      successResponse({
        today: {
          appointments: todayAppointments,
          revenue: todayRevenue[0]?.total || 0,
          onDuty: todayOnDuty,
        },
        month: {
          appointments: monthAppointments,
          revenue: monthRevenue[0]?.total || 0,
        },
        total: {
          technicians: totalTechnicians,
          customers: totalCustomers,
        },
        pending: {
          leaves: pendingLeaves,
        },
      })
    );
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/appointments/today", async (req, res) => {
  try {
    const today = dayjs().startOf("day");
    const tomorrow = dayjs().add(1, "day").startOf("day");

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate(),
      },
    }).sort({ startTime: 1 });

    res.json(successResponse(appointments));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/revenue/trend", async (req, res) => {
  try {
    const { days = "7" } = req.query;
    const daysNum = parseInt(days as string);

    const startDate = dayjs().subtract(daysNum - 1, "day").startOf("day");
    const endDate = dayjs().endOf("day");

    const results = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
          status: { $ne: "已取消" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
          },
          revenue: { $sum: "$paidAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dataMap: Record<string, any> = {};
    results.forEach((item) => {
      dataMap[item._id] = { date: item._id, revenue: item.revenue, count: item.count };
    });

    const trendData = [];
    for (let i = 0; i < daysNum; i++) {
      const date = dayjs().subtract(daysNum - 1 - i, "day").format("YYYY-MM-DD");
      trendData.push(dataMap[date] || { date, revenue: 0, count: 0 });
    }

    res.json(successResponse(trendData));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
