import { Router } from "express";
import Schedule from "../models/Schedule.js";
import dayjs from "dayjs";
import {
  successResponse,
  errorResponse,
  createChangeLog,
} from "../utils/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, technicianId, shiftType, status } = req.query;

    const filter: any = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate as string) };
    }
    if (technicianId) filter.technicianId = technicianId;
    if (shiftType) filter.shiftType = shiftType;
    if (status) filter.status = status;

    const list = await Schedule.find(filter).sort({ date: 1, technicianName: 1 });

    res.json(successResponse(list));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/calendar", async (req, res) => {
  try {
    const { month, technicianId } = req.query;

    if (!month) {
      return res.json(errorResponse("月份参数不能为空"));
    }

    const startOfMonth = dayjs(month as string).startOf("month").toDate();
    const endOfMonth = dayjs(month as string).endOf("month").toDate();

    const filter: any = {
      date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
    };
    if (technicianId) filter.technicianId = technicianId;

    const schedules = await Schedule.find(filter).sort({ date: 1 });

    const calendarData: Record<string, any[]> = {};
    for (const schedule of schedules) {
      const dateStr = dayjs(schedule.date).format("YYYY-MM-DD");
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = [];
      }
      calendarData[dateStr].push(schedule);
    }

    res.json(successResponse(calendarData));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.json(errorResponse("排班不存在"));
    }
    res.json(successResponse(schedule));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      technicianId,
      technicianName,
      date,
      shiftType,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime,
      leaveType,
      leaveReason,
      remark,
    } = req.body;

    if (!technicianId || !date || !shiftType) {
      return res.json(errorResponse("技师、日期和班次类型不能为空"));
    }

    const existing = await Schedule.findOne({
      technicianId,
      date: new Date(date),
    });
    if (existing) {
      return res.json(errorResponse("该技师当日已有排班"));
    }

    const schedule = new Schedule({
      technicianId,
      technicianName,
      date: new Date(date),
      shiftType,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime,
      leaveType,
      leaveReason,
      leaveStatus: leaveType ? "待审批" : null,
      remark,
      createdBy: "admin",
    });

    await schedule.save();

    await createChangeLog({
      module: "排班",
      action: "创建",
      targetId: schedule._id,
      targetType: "Schedule",
      targetName: `${schedule.technicianName}-${dayjs(schedule.date).format("MM-DD")}`,
      afterData: schedule.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "创建排班",
    });

    res.json(successResponse(schedule, "创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.post("/batch", async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.json(errorResponse("排班数据不能为空"));
    }

    const createdSchedules: any[] = [];
    for (const item of schedules) {
      const existing = await Schedule.findOne({
        technicianId: item.technicianId,
        date: new Date(item.date),
      });
      if (existing) {
        continue;
      }
      const schedule = new Schedule({
        ...item,
        date: new Date(item.date),
        createdBy: "admin",
      });
      await schedule.save();
      createdSchedules.push(schedule);
    }

    res.json(successResponse({ created: createdSchedules.length, list: createdSchedules }, "批量创建成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.json(errorResponse("排班不存在"));
    }

    const beforeData = schedule.toObject();

    Object.assign(schedule, req.body);
    if (req.body.date) {
      schedule.date = new Date(req.body.date);
    }
    schedule.status = "调整";
    await schedule.save();

    await createChangeLog({
      module: "排班",
      action: "修改",
      targetId: schedule._id,
      targetType: "Schedule",
      targetName: `${schedule.technicianName}-${dayjs(schedule.date).format("MM-DD")}`,
      beforeData,
      afterData: schedule.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "调整排班",
    });

    res.json(successResponse(schedule, "修改成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.json(errorResponse("排班不存在"));
    }

    await schedule.deleteOne();

    await createChangeLog({
      module: "排班",
      action: "删除",
      targetId: schedule._id,
      targetType: "Schedule",
      targetName: `${schedule.technicianName}-${dayjs(schedule.date).format("MM-DD")}`,
      beforeData: schedule.toObject(),
      operator: "admin",
      operatorRole: "管理员",
      remark: "删除排班",
    });

    res.json(successResponse(null, "删除成功"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/leave/approve", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.json(errorResponse("排班不存在"));
    }

    const { remark } = req.body;

    schedule.leaveStatus = "已批准";
    schedule.shiftType = "请假";
    schedule.status = "正常";

    await schedule.save();

    await createChangeLog({
      module: "排班",
      action: "审批",
      targetId: schedule._id,
      targetType: "Schedule",
      targetName: `${schedule.technicianName}-${dayjs(schedule.date).format("MM-DD")}`,
      operator: "admin",
      operatorRole: "管理员",
      remark: remark || "批准请假",
    });

    res.json(successResponse(schedule, "审批通过"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

router.put("/:id/leave/reject", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.json(errorResponse("排班不存在"));
    }

    const { remark } = req.body;

    schedule.leaveStatus = "已拒绝";

    await schedule.save();

    await createChangeLog({
      module: "排班",
      action: "审批",
      targetId: schedule._id,
      targetType: "Schedule",
      targetName: `${schedule.technicianName}-${dayjs(schedule.date).format("MM-DD")}`,
      operator: "admin",
      operatorRole: "管理员",
      remark: remark || "拒绝请假",
    });

    res.json(successResponse(schedule, "已拒绝"));
  } catch (error: any) {
    res.json(errorResponse(error.message));
  }
});

export default router;
